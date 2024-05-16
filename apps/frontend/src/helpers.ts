// TODO: how do you package and deploy the contract artifact from hardhat package?
//   L NX> check how dark forest handle this.
import * as BattleshipJSON from "../../hardhat/artifacts/contracts/Battleship.sol/Battleship.json";
import { deployedAddress } from "./consts";

// IMPROVE: can you get this GameState from hardhat compilation?
enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Won,
  P2Won,
}

const battleshipArtifact = {
  ...BattleshipJSON,
  // Added a new property of the deployed address.
  // Since we used CREATE2 to deploy contract (https://hardhat.org/ignition/docs/guides/create2),
  //   the deployed address should be the same across all chains.
  deployedAddress,
};

const battleshipEventTypes = {
  newGame: "NewGame",
};

const formatters = {
  dateTime(dateTime: Date) {
    return new Date(Number(dateTime) * 1000).toLocaleString();
  },
};

export { battleshipArtifact, GameState, battleshipEventTypes, formatters };
