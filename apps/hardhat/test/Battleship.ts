import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

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

  describe("Player 1 deploy the contract", () => {
    it("should deploy a contract", async () => {
      const { battleship, p1 } = await loadFixture(deployFixture);
      expect(await battleship.gameState()).equal(GameState.P1Joined);
      expect(await battleship.p1()).equal(await p1.getAddress());
    });

    it("should allow anyone who are not player 1 to join as another player", async () => {
      const { battleship, p1, p2 } = await loadFixture(deployFixture);
      const p2Addr = await p2.getAddress();

      await expect(battleship.connect(p1).p2join())
        .revertedWith(/same as player 1/);

      await expect(battleship.connect(p2).p2join())
        .emit(battleship, "P2Joined")
        .withArgs(p2Addr);

      expect(await battleship.p2()).equal(p2Addr);
      expect(await battleship.gameState()).equal(GameState.P2Joined);
    });
  });
});
