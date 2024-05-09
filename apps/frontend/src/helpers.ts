// TODO: how do you package and deploy the contract artifact from hardhat package?
//   L NX> check how dark forest handle this.
import battleshipArtifact from "../../hardhat/artifacts/contracts/Battleship.sol/Battleship.json";

// IMPROVE: can you get this GameState from hardhat compilation?
enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Won,
  P2Won,
}

export { battleshipArtifact, GameState };
