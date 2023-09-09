// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILocVerifier {
  function verifyProof(
    uint256[24] calldata _proof,
    uint256[1] calldata _pubSignals
  ) external view returns (bool);
}

contract Battleship {
  // -- on-chain data --
  ILocVerifier public immutable locVerifier;

  struct Move {
    uint8 x;
    uint8 y;
    bool isHit;
  }

  struct Game {
    address player1;
    address player2;
    uint256 player1Hash;
    uint256 player2Hash;
    mapping (uint => Move) moves;
    uint movesSize;
  }

  uint32 nextGameID;
  mapping(uint32 => Game) games;

  // -- end: on-chain data --

  // constructor
  constructor(
    ILocVerifier _locVerifier
  ) {
    locVerifier = _locVerifier;
  }

  function requireLocProof(
    bytes calldata _proof,
    uint256 _boardHash
  ) internal view {
    (uint256[24] memory p) = abi.decode(_proof, (uint256[24]));
    require(
      locVerifier.verifyProof(p, [_boardHash]),
      "Invalid board state (ZK)"
    );
  }

  function createGame(
    bytes calldata proof,
    uint256 boardHash
  ) public returns (uint32) {
    requireLocProof(proof, boardHash);
    uint32 currentID = nextGameID;
    nextGameID += 1;

    Game storage g = games[currentID];
    g.player1 = msg.sender;
    g.player1Hash = boardHash;
    g.movesSize = 0;

    return currentID;
  }

  function joinGame(
    uint32 gameID,
    bytes calldata proof,
    uint256 boardHash
  ) public {
    require(gameID >= 0, "Invalid Game ID");
    require(gameID < nextGameID, "Invalid Game ID (exceed upper bound)");

    Game storage g = games[gameID];
    require(g.player1 != msg.sender, "Should not be the same as player 1");
    require(g.player2 == address(0), "Game has been joined");
    requireLocProof(proof, boardHash);

    g.player2 = msg.sender;
    g.player2Hash = boardHash;
  }
}
