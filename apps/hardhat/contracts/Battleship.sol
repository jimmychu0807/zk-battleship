// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Battleship {
  // constant
  uint8 public constant TOTAL_SHIPS = 4;
  uint8[2][4] public SHIP_SIZE = [
    [1, 2],  // 2
    [1, 3],  // 3
    [1, 4],  // 4
    [1, 5]   // 5, total = 14
  ];
  uint8 public constant BOARD_ROWS = 9;
  uint8 public constant BOARD_COLS = 9;

  struct Ship {
    uint8[][] body;
    uint8[][] top_left;
    uint8[][] bottom_right;
    bool alive;
  }
  // p1 and p2 addr, only they can send the missile
  address public p1;
  address public p2;
  // p1 & p2 attack history list
  mapping(address => uint8[][]) moves;
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
  GameState public game_state;

  modifier AnyPlayer() {
    require(msg.sender == p1 || msg.sender == p2, "Not one of the game player");
    _;
  }

  modifier P1JoinedState() {
    require(game_state == GameState.P1Joined, "Game not in P1Joined state");
    _;
  }

  modifier P2JoinedState() {
    require(game_state == GameState.P2Joined, "Game not in P2Joined state");
    _;
  }

  modifier ForP1Move() {
    require(game_state == GameState.P1Move, "Not for player 1 to move now");
    require(msg.sender == p1, "Not player 1");
    _;
  }

  modifier ForP2Move() {
    require(game_state == GameState.P2Move, "Not for player 2 to move now");
    require(msg.sender == p2, "Not player 2");
    _;
  }

  constructor() {
    p1 = msg.sender;
    game_state = GameState.P1Joined;
  }

  function p2join() public P1JoinedState {
    require(p1 != msg.sender, "Cannot be the same as player 1");
    p2 = msg.sender;
    game_state = GameState.P2Joined;
  }

  function setupShips() public P2JoinedState AnyPlayer {

  }

  function startGame() public P2JoinedState {
    // check that p1ships config and p2ships config are properly configured

    game_state = GameState.P1Move;
  }

  function playerMove(uint8[2] memory hitXY) public AnyPlayer {
    require(game_state == GameState.P1Move || game_state == GameState.P2Move, "Game is not in a moving state");
    if (game_state == GameState.P1Move) {
      require(p1 == msg.sender, "Not recognized as player 1");
    } else {
      require(p2 == msg.sender, "Not recognized as player 2");
    }

    // Logic of adding the move in the corresponding move list


    // Update the game state
    if (game_state == GameState.P1Move) {
      if (isGameEnd()) {
        game_state = GameState.P1Win;
      } else {
        game_state = GameState.P2Move;
      }
    } else {
      // game_state == GameState.P2Move
      if (isGameEnd()) {
        game_state = GameState.P2Win;
      } else {
        game_state = GameState.P1Move;
      }
    }
  }

  function isGameEnd() public view returns (bool) {
    // check if the game ends
    return true;
  }
}
