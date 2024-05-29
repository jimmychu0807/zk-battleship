// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBattleship {
  struct ShipType {
    string name;
    uint8[2] size;
  }

  struct Ship {
    uint64 body;
    uint8[2] topLeft;
    uint8[2] bottomRight;
    bool alive;
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
    uint256 startTime;
    uint256 lastUpdate;
    uint256 endTime;
  }

  struct GameRoundView {
    address p1;
    address p2;
    GameState state;
    uint256 startTime;
    uint256 lastUpdate;
    uint256 endTime;
  }

  struct ShipSetupInfo {
    uint8 shipId;
    uint8[2] topLeft;
    uint8[2] bottomRight;
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

  // Error declaration
  error Battleship__CurrentStateNoPlayerCanMove();
  error Battleship__CurrentStateOnlyPlayerCanMove(address);
  error Battleship__NotInAllowedState(GameState);
  error Battleship__NotOneOfGamePlayers();
  error Battleship__RoundHasEnded();
  error Battleship__RoundIdOutOfBound();
  error Battleship__SameAsPlayer1();
  error Battleship__ShipIdOutOfBound();
  error Battleship__SetupShipNotTopLeftCoordinate();
  error Battleship__ShipPlacementOutOfBound();
  error Battleship__ShipSizeNotMatch();
  error Battleship__PlayerStillSettingUpShips(address);
  error Battleship__PlayerMoveOutOfBound();

  // Events declaration
  event NewGame(uint32 indexed roundId, address indexed sender);
  event P2Joined(uint32 indexed roundId, address indexed sender);
  event SetupShip(uint32 indexed roundId, address indexed sender, uint8 shipId);
  event GameStart(uint32 indexed roundId);
  event PlayerMove(
    uint32 indexed roundId,
    address indexed sender,
    uint8[2] hitRC,
    GameState gameState
  );
  event Hit(uint32 indexed roundId, address indexed opponent);
  event SinkShip(uint32 indexed roundId, address indexed opponent, uint8 shipId);

  function getShipTypes() external view returns (ShipType[] memory);
  function getShipTypeNum() external view returns (uint16);
  function getBoardSize() external pure returns (uint8[2] memory);
  function getAllRounds() external view returns (GameRoundView[] memory);
  function getRound(uint32 roundId) external view returns (GameRoundView memory);
  function getRoundMoves(uint32 roundId, address p) external view returns (uint8[2][] memory);
  function getRoundShips(uint32 roundId, address p) external view returns (Ship[] memory);
  function newGame() external returns (uint32);
  function p2join(uint32 roundId) external;
  function setupShips(uint32 roundId, ShipSetupInfo[] calldata info) external;
  function allPlayerShipsReady(uint32 roundId, address player) external view returns (bool);
  function startGame(uint32 roundId) external returns (GameState);
  function playerMove(uint32 roundId, uint8[2] calldata hitRC) external returns (GameState);
}
