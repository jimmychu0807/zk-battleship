// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Battleship is Ownable {
  struct ShipType {
    string name;
    uint8[2] size;
  }
  ShipType[] public shipTypes;

  uint8[2] public boardSize = [9, 9];

  struct Ship {
    uint256 body;
    uint8[2] topLeft;
    uint8[2] bottomRight;
    bool alive;
  }

  // game state
  enum GameState {
    P1Joined,
    P2Joined,
    P1Move,
    P2Move,
    P1Won,
    P2Won
  }

  struct GameRound {
    // p1 and p2 addr, only they can send the missile
    address p1;
    address p2;

    // p1 & p2 attack history list
    mapping(address => uint8[2][]) moves;
    // p1 & p2 ship setup configuration
    mapping(address => Ship[]) ships;
    GameState state;
  }
  GameRound[] public rounds;
  uint256 public nextRoundId = 0;

  // Events declaration
  event NewGame(uint indexed roundId, address indexed sender);
  event P2Joined(uint indexed roundId, address indexed sender);
  event SetupShip(uint indexed roundId, address indexed sender, uint8 shipId);
  event GameStart(uint indexed roundId);
  event PlayerMove(uint indexed roundId, address indexed sender, uint8[2] hitRC, GameState gameState);
  event Hit(uint indexed roundId, address indexed opponent);
  event SinkShip(uint indexed roundId, address indexed opponent, uint8 shipIdx);

  // --- End of events declaration

  // Modifiers declaration
  modifier validRoundId(uint roundId) {
    require(roundId < nextRoundId, "roundId is out of bound");
    _;
  }

  modifier onlyPlayers(uint roundId) {
    GameRound storage round = rounds[roundId];
    require(msg.sender == round.p1 || msg.sender == round.p2, "Not one of the game players");
    _;
  }

  modifier allowedState(uint roundId, GameState targetS) {
    require(rounds[roundId].state == targetS, "The game is not in its target state");
    _;
  }

  modifier playerToMove(uint roundId) {
    GameRound storage round = rounds[roundId];
    require(
      round.state == GameState.P1Move || round.state == GameState.P2Move,
      "Current game doesn't allow either players to move"
    );
    if (round.state == GameState.P1Move) {
      require(round.p1 == msg.sender, "Expecting player 1 to move");
    }
    if (round.state == GameState.P2Move) {
      require(round.p2 == msg.sender, "Expecting player 2 to move");
    }
    _;
  }

  // --- End of modifiers declaration

  // Constructor
  constructor(ShipType[] memory _shipTypes) Ownable(msg.sender) {
    // Initialize ship types
    for(uint8 i = 0; i < _shipTypes.length; i++) {
      shipTypes.push(_shipTypes[i]);
    }
  }

  // Viewer functions declaration
  function getShipTypes() public view returns(ShipType[] memory) {
    return shipTypes;
  }

  function getShipTypeNum() public view returns(uint8) {
    return uint8(shipTypes.length);
  }

  function getBoardSize() public view returns(uint8[2] memory) {
    return boardSize;
  }

  function getRoundInfo(uint roundId) public view
    validRoundId(roundId)
    returns(address, address, GameState)
  {
    GameRound storage round = rounds[roundId];
    return (round.p1, round.p2, round.state);
  }

  function getRoundMoves(uint roundId, address p) public view
    validRoundId(roundId)
    returns(uint8[2][] memory)
  {
    return rounds[roundId].moves[p];
  }

  function getRoundShips(uint roundId, address p) public view
    validRoundId(roundId)
    returns(Ship[] memory)
  {
    return rounds[roundId].ships[p];
  }

  // --- End of viewer functions declaration

  function newGame() public {
    GameRound storage round = rounds.push();
    round.p1 = msg.sender;
    round.state = GameState.P1Joined;
    emit NewGame(nextRoundId, msg.sender);

    nextRoundId++;
  }

  function p2join(uint roundId) public
    validRoundId(roundId)
    allowedState(roundId, GameState.P1Joined)
  {
    GameRound storage round = rounds[roundId];
    require(round.p1 != msg.sender, "Cannot be the same as player 1");
    round.p2 = msg.sender;
    round.state = GameState.P2Joined;

    emit P2Joined(roundId, msg.sender);
  }

  function setupShips(
    uint roundId,
    uint8 shipId,
    uint8[2] memory topLeft,
    uint8[2] memory bottomRight
  ) public
    validRoundId(roundId)
    allowedState(roundId, GameState.P2Joined)
    onlyPlayers(roundId)
  {
    require(shipId < getShipTypeNum(), "shipId is out of bound");
    // validate the ship topLeft and bottomRight coordinates are correct
    require (topLeft[0] <= bottomRight[0], "topLeft row is greater than bottomRight row");
    require (topLeft[1] <= bottomRight[1], "topLeft col is greater than bottomRight col");
    require (bottomRight[0] < boardSize[0], "ship is placed out of bound (on row)");
    require (bottomRight[1] < boardSize[1], "ship is placed out of bound (on column)");

    uint8[2] storage shipSize = shipTypes[shipId].size;
    uint8 rowSize = bottomRight[0] - topLeft[0] + 1;
    uint8 colSize = bottomRight[1] - topLeft[1] + 1;

    require (
      (rowSize == shipSize[0] && colSize == shipSize[1])
      || (rowSize == shipSize[1] && colSize == shipSize[0]),
      "ship submitted size doesn't match its expected size"
    );

    // retrieve the appropriate ship
    Ship[] storage playerShips = rounds[roundId].ships[msg.sender];

    if (playerShips.length == 0) {
      // create empty ships for the player
      for (uint8 i = 0; i < getShipTypeNum(); i++) {
        playerShips.push(Ship({
          body: 0,
          topLeft: [0,0],
          bottomRight: [0,0],
          alive: false
        }));
      }
    }

    // TODO: Check the ship placement doesn't overlapp with other ships

    // Fill the ship body with bit of 1
    playerShips[shipId].body = 2**(shipSize[0] * shipSize[1]) - 1;
    playerShips[shipId].topLeft = topLeft;
    playerShips[shipId].bottomRight = bottomRight;
    playerShips[shipId].alive = true;

    emit SetupShip(roundId, msg.sender, shipId);
  }

  function startGame(uint roundId) public
    validRoundId(roundId)
    allowedState(roundId, GameState.P2Joined)
  {
    GameRound storage round = rounds[roundId];
    address p1 = round.p1;
    address p2 = round.p2;

    require(round.ships[p1].length == getShipTypeNum(), "player 1 ships are not properly setup");
    require(round.ships[p2].length == getShipTypeNum(), "player 2 ships are not properly setup");

    // check that p1ships config and p2ships config are properly configured
    for(uint s = 0; s < getShipTypeNum(); s++) {
      require(round.ships[p1][s].alive, "player 1 ships are not properly setup");
      require(round.ships[p2][s].alive, "player 2 ships are not properly setup");
    }

    rounds[roundId].state = GameState.P1Move;

    emit GameStart(roundId);
  }

  function playerMove(uint roundId, uint8[2] memory hitRC) public
    validRoundId(roundId)
    playerToMove(roundId)
  {
    // Logic of adding the move in the corresponding move list
    require(hitRC[0] < boardSize[0] && hitRC[1] < boardSize[1], "Player move is out of bound");

    // Add to the player move list
    GameRound storage round = rounds[roundId];
    uint8[2][] storage playerMoves = round.moves[msg.sender];
    playerMoves.push(hitRC);

    // Check if it hits opponent ship
    address opponent = msg.sender == round.p1 ? round.p2 : round.p1;
    Ship[] storage opponentShips = round.ships[opponent];

    for (uint8 sIdx = 0; sIdx < getShipTypeNum(); sIdx++) {
      Ship storage ship = opponentShips[sIdx];
      if (
        ship.topLeft[0] <= hitRC[0] && hitRC[0] <= ship.bottomRight[0] // for row check
        && ship.topLeft[1] <= hitRC[1] && hitRC[1] <= ship.bottomRight[1] // for col check
      ) {
        // hit the ship
        uint8 rowWidth = ship.bottomRight[1] - ship.topLeft[1] + 1;
        uint8 bodyIdx = (hitRC[0] - ship.topLeft[0]) * rowWidth + (hitRC[1] - ship.topLeft[1]);
        uint8 reverseIdx = (shipTypes[sIdx].size[0] * shipTypes[sIdx].size[1]) - bodyIdx - 1;
        uint256 mask = ~(1 << reverseIdx);
        ship.body &= mask;

        // mark the ship as dead if its body are all hit
        if (ship.body > 0) {
          emit Hit(roundId, opponent);
        } else {
          ship.alive = false;
          emit SinkShip(roundId, opponent, sIdx);
        }
      }
    }

    // Update the game state
    round.state = isGameEnd(roundId)
      ? (round.state == GameState.P1Move ? GameState.P1Won : GameState.P2Won)
      : (round.state == GameState.P1Move ? GameState.P2Move : GameState.P1Move);

    // Emit an event
    emit PlayerMove(roundId, msg.sender, hitRC, round.state);
  }

  function isGameEnd(uint roundId) public view
    validRoundId(roundId)
    returns (bool)
  {
    // check if the game ends
    GameRound storage round = rounds[roundId];

    if (round.state == GameState.P1Joined || round.state == GameState.P2Joined)
      return false;

    if (round.state == GameState.P1Won || round.state == GameState.P2Won)
      return true;

    bool bEnd = true;
    Ship[] memory p1ships = round.ships[round.p1];
    Ship[] memory p2ships = round.ships[round.p2];

    for (uint8 s = 0; s < getShipTypeNum(); s++) {
      if (p1ships[s].alive) {
        bEnd = false;
        break;
      }
    }
    if (bEnd) return true;

    bEnd = true;
    for (uint8 s = 0; s < getShipTypeNum(); s++) {
      if (p2ships[s].alive) {
        bEnd = false;
        break;
      }
    }
    return bEnd;
  }
}
