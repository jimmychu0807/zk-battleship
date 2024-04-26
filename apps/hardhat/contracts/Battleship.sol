// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Battleship {
  // constant
  uint8 public constant TOTAL_SHIPS = 4;
  string[4] public SHIP_NAMES = [
    "Submarine",
    "Cruiser",
    "Battleship",
    "Carrier"
  ];
  uint8[2][4] public SHIP_SIZES = [
    [1, 2],  // 2
    [1, 3],  // 3
    [1, 4],  // 4
    [2, 4]   // 8, total = 17
  ];
  uint8 public constant BOARD_ROWS = 9;
  uint8 public constant BOARD_COLS = 9;

  struct Ship {
    uint8[][] body;
    uint8[2] topLeft;
    uint8[2] bottomRight;
    bool alive;
  }
  // p1 and p2 addr, only they can send the missile
  address public p1;
  address public p2;
  // p1 & p2 attack history list
  mapping(address => uint8[2][]) moves;
  // p1 & p2 ship setup configuration
  mapping(address => Ship[]) ships;

  // game state: gameSetup, player1Move, player2Move, player1Win, player2Win.
  enum GameState {
    P1Joined,
    P2Joined,
    P1Move,
    P2Move,
    P1Win,
    P2Win
  }
  GameState public gameState;

  modifier AnyPlayer() {
    require(msg.sender == p1 || msg.sender == p2, "Not one of the game players");
    _;
  }

  modifier P1JoinedState() {
    require(gameState == GameState.P1Joined, "Game not in P1Joined state");
    _;
  }

  modifier P2JoinedState() {
    require(gameState == GameState.P2Joined, "Game not in P2Joined state");
    _;
  }

  modifier PlayerToMove() {
    require(
      gameState == GameState.P1Move || gameState == GameState.P2Move,
      "Current game doesn't allow either players to move"
    );
    if (gameState == GameState.P1Move) {
      require(p1 == msg.sender, "Expecting player 1 to move");
    }
    if (gameState == GameState.P2Move) {
      require(p2 == msg.sender, "Expecting player 2 to move");
    }
    _;
  }

  constructor() {
    p1 = msg.sender;
    gameState = GameState.P1Joined;
  }

  function p2join() public P1JoinedState {
    require(p1 != msg.sender, "Cannot be the same as player 1");
    p2 = msg.sender;
    gameState = GameState.P2Joined;
  }

  function setupShips(
    uint8 shipId,
    uint8[2] memory topLeft,
    uint8[2] memory bottomRight
  ) public
    P2JoinedState
    AnyPlayer
  {
    require(shipId < TOTAL_SHIPS, "shipId is out of bound");
    // validate the ship topLeft and bottomRight coordinates are correct
    require (topLeft[0] <= bottomRight[0], "topLeft row is greater than bottomRight row");
    require (topLeft[1] <= bottomRight[1], "topLeft col is greater than bottomRight col");
    require (bottomRight[0] < BOARD_ROWS, "ship is placed out of bound (on row)");
    require (bottomRight[1] < BOARD_COLS, "ship is placed out of bound (on column)");

    uint8[2] storage shipSize = SHIP_SIZES[shipId];
    uint8 rowSize = bottomRight[0] - topLeft[0] + 1;
    uint8 colSize = bottomRight[1] - topLeft[1] + 1;

    require (
      (rowSize == shipSize[0] && colSize == shipSize[1])
      || (rowSize == shipSize[1] && colSize == shipSize[0]),
      "ship submitted size doesn't match its expected size"
    );

    // retrieve the appropriate ship
    Ship[] storage playerShips = ships[msg.sender];

    // Fill the ship body with 0
    for (uint8 row = 0; row < rowSize; row++) {
      for (uint8 col = 0; col < colSize; col++) {
        playerShips[shipId].body[row][col] = 0;
      }
    }
    playerShips[shipId].topLeft = topLeft;
    playerShips[shipId].bottomRight = bottomRight;
    playerShips[shipId].alive = true;
  }

  function startGame() public P2JoinedState {
    // check that p1ships config and p2ships config are properly configured
    for(uint s = 0; s < TOTAL_SHIPS; s++) {
      require(ships[p1][s].alive, "player 1 ships are not setup properly");
      require(ships[p2][s].alive, "player 2 ships are not setup properly");
    }

    gameState = GameState.P1Move;
  }

  function playerMove(uint8[2] memory hitXY) public PlayerToMove {
    // Logic of adding the move in the corresponding move list
    require(hitXY[0] < BOARD_ROWS && hitXY[1] < BOARD_COLS, "Player move is out of bound");

    // Add to the player move list
    uint8[2][] storage playerMoves = moves[msg.sender];
    playerMoves.push(hitXY);

    // Check if it hits opponent ship
    Ship[] storage opponentShips = msg.sender == p1 ? ships[p2] : ships[p1];

    for (uint8 sIdx = 0; sIdx < TOTAL_SHIPS; sIdx++) {
      Ship storage ship = opponentShips[sIdx];
      if (
        ship.topLeft[0] <= hitXY[0] && hitXY[0] <= ship.bottomRight[0] // for row check
        && ship.topLeft[1] <= hitXY[1] && hitXY[1] <= ship.bottomRight[1] // for col check
      ) {
        // hit the ship
        ship.body[hitXY[0] - ship.topLeft[0]][hitXY[1] - ship.topLeft[1]] = 1;

        // mark the ship as dead if its body are all hit
        bool shipAlive = false;
        uint8 rowSize = ship.bottomRight[0] - ship.topLeft[0] + 1;
        uint8 colSize = ship.bottomRight[1] - ship.topLeft[1] + 1;

        for(uint8 row = 0; row < rowSize; row++) {
          for (uint8 col = 0; col < colSize; col++) {
            if (ship.body[row][col] == 0) {
              shipAlive = true;
              break;
            }
          }
        }
        ship.alive = shipAlive;
      }
    }

    // Update the game state
    gameState = gameState == GameState.P1Move
      ? (isGameEnd() ? GameState.P1Win : GameState.P2Move)
      : (isGameEnd() ? GameState.P2Win : GameState.P1Move);
  }

  function isGameEnd() public view returns (bool) {
    // check if the game ends
    Ship[] storage p1ships = ships[p1];
    Ship[] storage p2ships = ships[p2];

    bool bEnd = true;

    for (uint8 s = 0; s < TOTAL_SHIPS; s++) {
      if (p1ships[s].alive || p2ships[s].alive) {
        bEnd = false;
        break;
      }
    }
    return bEnd;
  }
}
