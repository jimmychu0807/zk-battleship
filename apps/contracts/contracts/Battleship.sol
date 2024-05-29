// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBattleship} from "./interfaces/IBattleship.sol";
import {BOARD_ROWS, BOARD_COLS} from "./base/Constants.sol";

contract Battleship is IBattleship, Ownable {
  ShipType[] public shipTypes;
  GameRound[] public rounds;
  uint32 public nextRoundId = 0;

  // Modifiers declaration
  modifier validRoundId(uint32 roundId) {
    if (roundId >= nextRoundId) {
      revert Battleship__RoundIdOutOfBound();
    }
    _;
  }

  modifier onlyPlayers(uint32 roundId) {
    GameRound storage round = rounds[roundId];
    if (round.p1 != msg.sender && round.p2 != msg.sender) {
      revert Battleship__NotOneOfGamePlayers();
    }
    _;
  }

  modifier allowedState(uint32 roundId, GameState targetState) {
    if (rounds[roundId].state != targetState) {
      revert Battleship__NotInAllowedState(targetState);
    }
    _;
  }

  modifier playerToMove(uint32 roundId) {
    GameRound storage round = rounds[roundId];

    if (round.state != GameState.P1Move && round.state != GameState.P2Move) {
      revert Battleship__CurrentStateNoPlayerCanMove();
    }
    if (round.state == GameState.P1Move && round.p1 != msg.sender) {
      revert Battleship__CurrentStateOnlyPlayerCanMove(round.p1);
    }
    if (round.state == GameState.P2Move && round.p2 != msg.sender) {
      revert Battleship__CurrentStateOnlyPlayerCanMove(round.p2);
    }
    _;
  }

  modifier nonEndState(uint32 roundId) {
    GameRound storage round = rounds[roundId];
    if (round.state == GameState.P1Won || round.state == GameState.P2Won) {
      revert Battleship__RoundHasEnded();
    }
    _;
  }

  // Constructor
  constructor(ShipType[] memory _shipTypes) Ownable(msg.sender) {
    // Initialize ship types
    for (uint8 i = 0; i < _shipTypes.length; i++) {
      shipTypes.push(_shipTypes[i]);
    }
  }

  // Viewer functions declaration
  function getShipTypes() external view override returns (ShipType[] memory) {
    return shipTypes;
  }

  function _getShipTypeNum() internal view returns (uint16) {
    return uint16(shipTypes.length);
  }

  function getBoardSize() external pure override returns (uint8[2] memory) {
    return [BOARD_ROWS, BOARD_COLS];
  }

  function getAllRounds() external view override returns (GameRoundView[] memory) {
    GameRoundView[] memory rView = new GameRoundView[](rounds.length);

    for (uint64 i = 0; i < rounds.length; i++) {
      GameRound storage r = rounds[i];
      rView[i] = GameRoundView(r.p1, r.p2, r.state, r.startTime, r.lastUpdate, r.endTime);
    }
    return rView;
  }

  function getRound(
    uint32 roundId
  ) external view override validRoundId(roundId) returns (GameRoundView memory) {
    GameRound storage r = rounds[roundId];
    return GameRoundView(r.p1, r.p2, r.state, r.startTime, r.lastUpdate, r.endTime);
  }

  function getRoundMoves(
    uint32 roundId,
    address p
  ) external view override validRoundId(roundId) returns (uint8[2][] memory) {
    return rounds[roundId].moves[p];
  }

  function getRoundShips(
    uint32 roundId,
    address p
  ) external view override validRoundId(roundId) returns (Ship[] memory) {
    return rounds[roundId].ships[p];
  }

  function newGame() external override returns (uint32 currentId) {
    GameRound storage round = rounds.push();
    round.p1 = msg.sender;
    currentId = nextRoundId++;
    _updateGameState(currentId, GameState.P1Joined);

    emit NewGame(currentId, msg.sender);
  }

  function p2join(
    uint32 roundId
  ) external override validRoundId(roundId) allowedState(roundId, GameState.P1Joined) {
    GameRound storage round = rounds[roundId];
    if (round.p1 == msg.sender) {
      revert Battleship__SameAsPlayer1();
    }
    round.p2 = msg.sender;
    _updateGameState(roundId, GameState.P2Joined);

    emit P2Joined(roundId, msg.sender);
  }

  function setupShips(
    uint32 roundId,
    ShipSetupInfo[] calldata info
  )
    external
    override
    validRoundId(roundId)
    allowedState(roundId, GameState.P2Joined)
    onlyPlayers(roundId)
  {
    for (uint8 i = 0; i < info.length; i++) {
      _setupShip(roundId, info[i].shipId, info[i].topLeft, info[i].bottomRight);
    }

    // start game if both side have completed ship setup
    GameRound storage round = rounds[roundId];
    if (allPlayerShipsReady(roundId, round.p1) && allPlayerShipsReady(roundId, round.p2)) {
      startGame(roundId);
    }
  }

  function _setupShip(
    uint32 roundId,
    uint8 shipId,
    uint8[2] calldata topLeft,
    uint8[2] calldata bottomRight
  )
    internal
    validRoundId(roundId)
    allowedState(roundId, GameState.P2Joined)
    onlyPlayers(roundId)
    returns (bool)
  {
    if (shipId >= _getShipTypeNum()) {
      revert Battleship__ShipIdOutOfBound();
    }
    // validate the ship topLeft and bottomRight coordinates are correct
    if (topLeft[0] > bottomRight[0] || topLeft[1] > bottomRight[1]) {
      revert Battleship__SetupShipNotTopLeftCoordinate();
    }
    if (bottomRight[0] >= BOARD_ROWS || bottomRight[1] >= BOARD_COLS) {
      revert Battleship__ShipPlacementOutOfBound();
    }

    uint8[2] storage shipSize = shipTypes[shipId].size;
    uint8 rowSize = bottomRight[0] - topLeft[0] + 1;
    uint8 colSize = bottomRight[1] - topLeft[1] + 1;

    if (
      !((rowSize == shipSize[0] && colSize == shipSize[1]) ||
        (rowSize == shipSize[1] && colSize == shipSize[0]))
    ) {
      revert Battleship__ShipSizeNotMatch();
    }

    // retrieve the appropriate ship
    Ship[] storage playerShips = rounds[roundId].ships[msg.sender];

    if (playerShips.length == 0) {
      // create empty ships for the player
      for (uint8 i = 0; i < _getShipTypeNum(); i++) {
        playerShips.push(Ship({body: 0, topLeft: [0, 0], bottomRight: [0, 0], alive: false}));
      }
    }

    // TODO: Check the ship placement doesn't overlapp with other ships

    // Fill the ship body with bit of 1
    playerShips[shipId].body = uint64(2 ** (shipSize[0] * shipSize[1])) - 1;
    playerShips[shipId].topLeft = topLeft;
    playerShips[shipId].bottomRight = bottomRight;
    playerShips[shipId].alive = true;

    emit SetupShip(roundId, msg.sender, shipId);
    return true;
  }

  function allPlayerShipsReady(
    uint32 roundId,
    address player
  ) public view override validRoundId(roundId) returns (bool) {
    Ship[] storage playerShips = rounds[roundId].ships[player];
    if (playerShips.length < shipTypes.length) return false;
    for (uint8 i = 0; i < playerShips.length; i++) {
      if (!playerShips[i].alive) return false;
    }
    return true;
  }

  function startGame(
    uint32 roundId
  )
    public
    override
    validRoundId(roundId)
    allowedState(roundId, GameState.P2Joined)
    returns (GameState)
  {
    GameRound storage round = rounds[roundId];
    address p1 = round.p1;
    address p2 = round.p2;

    if (round.ships[p1].length < _getShipTypeNum()) {
      revert Battleship__PlayerStillSettingUpShips(p1);
    }
    if (round.ships[p2].length < _getShipTypeNum()) {
      revert Battleship__PlayerStillSettingUpShips(p2);
    }

    // check that p1ships config and p2ships config are properly configured
    for (uint16 s = 0; s < _getShipTypeNum(); s++) {
      if (!round.ships[p1][s].alive) {
        revert Battleship__PlayerStillSettingUpShips(p1);
      }
      if (!round.ships[p2][s].alive) {
        revert Battleship__PlayerStillSettingUpShips(p2);
      }
    }

    _updateGameState(roundId, GameState.P1Move);

    emit GameStart(roundId);
    return (round.state);
  }

  // TODO: fix later
  // solhint-disable-next-line code-complexity
  function playerMove(
    uint32 roundId,
    uint8[2] calldata hitRC
  ) external override validRoundId(roundId) playerToMove(roundId) returns (GameState) {
    // Logic of adding the move in the corresponding move list
    if (hitRC[0] >= BOARD_ROWS || hitRC[1] >= BOARD_COLS) {
      revert Battleship__PlayerMoveOutOfBound();
    }

    // Add to the player move list
    GameRound storage round = rounds[roundId];
    uint8[2][] storage playerMoves = round.moves[msg.sender];
    playerMoves.push(hitRC);

    // Check if it hits opponent ship
    address opponent = msg.sender == round.p1 ? round.p2 : round.p1;
    Ship[] storage opponentShips = round.ships[opponent];

    for (uint8 sIdx = 0; sIdx < _getShipTypeNum(); sIdx++) {
      Ship storage ship = opponentShips[sIdx];
      if (
        ship.topLeft[0] <= hitRC[0] &&
        hitRC[0] <= ship.bottomRight[0] && // for row check
        ship.topLeft[1] <= hitRC[1] &&
        hitRC[1] <= ship.bottomRight[1] // for col check
      ) {
        // hit the ship
        uint8 rowWidth = ship.bottomRight[1] - ship.topLeft[1] + 1;
        uint8 bodyIdx = (hitRC[0] - ship.topLeft[0]) * rowWidth + (hitRC[1] - ship.topLeft[1]);
        uint8 reverseIdx = (shipTypes[sIdx].size[0] * shipTypes[sIdx].size[1]) - bodyIdx - 1;
        uint64 mask = ~(uint64(1) << reverseIdx);
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
    if (_isGameEnd(roundId)) {
      if (round.state == GameState.P1Move) {
        _updateGameState(roundId, GameState.P1Won);
      } else {
        _updateGameState(roundId, GameState.P2Won);
      }
    } else {
      if (round.state == GameState.P1Move) {
        _updateGameState(roundId, GameState.P2Move);
      } else {
        _updateGameState(roundId, GameState.P1Move);
      }
    }

    emit PlayerMove(roundId, msg.sender, hitRC, round.state);
    return (round.state);
  }

  function _updateGameState(
    uint32 roundId,
    GameState state
  ) internal validRoundId(roundId) nonEndState(roundId) {
    GameRound storage round = rounds[roundId];
    round.state = state;

    // Dealing with time recording
    round.lastUpdate = block.timestamp;
    if (state == GameState.P1Joined) {
      round.startTime = round.lastUpdate;
    } else if (state == GameState.P1Won || state == GameState.P2Won) {
      round.endTime = round.lastUpdate;
    }
  }

  // TODO: fix later
  // solhint-disable-next-line code-complexity
  function _isGameEnd(uint32 roundId) internal view validRoundId(roundId) returns (bool) {
    // check if the game ends
    GameRound storage round = rounds[roundId];

    if (round.state == GameState.P1Joined || round.state == GameState.P2Joined) return false;

    if (round.state == GameState.P1Won || round.state == GameState.P2Won) return true;

    bool bEnd = true;
    Ship[] memory p1ships = round.ships[round.p1];
    Ship[] memory p2ships = round.ships[round.p2];

    for (uint8 s = 0; s < _getShipTypeNum(); s++) {
      if (p1ships[s].alive) {
        bEnd = false;
        break;
      }
    }
    if (bEnd) return true;

    bEnd = true;
    for (uint8 s = 0; s < _getShipTypeNum(); s++) {
      if (p2ships[s].alive) {
        bEnd = false;
        break;
      }
    }
    return bEnd;
  }
}
