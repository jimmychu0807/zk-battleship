import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Win,
  P2Win,
}

describe("Battleship", function () {
  async function deployFixture() {
    // @ts-ignore
    const [p1, p2] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();
    return { battleship, p1, p2 };
  }

  describe("Deployment", () => {
    it("Should deploy a contract properly", async () => {
      const { battleship, p1, p2 } = await loadFixture(deployFixture);
      expect(await battleship.gameState()).equal(GameState.P1Joined);
      expect(await battleship.p1()).equal(await p1.getAddress());
    });
  });
});
