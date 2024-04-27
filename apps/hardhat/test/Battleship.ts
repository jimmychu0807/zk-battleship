import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Won,
  P2Won,
}

const helpers = {
  async setupPlayerShips(battleship: any, p: any) {
    const pBattleship = battleship.connect(p);
    await pBattleship.setupShips(0, [0, 0], [0, 1]);
    await pBattleship.setupShips(1, [1, 0], [1, 2]);
    await pBattleship.setupShips(2, [2, 0], [2, 3]);
    await pBattleship.setupShips(3, [3, 0], [4, 3]);
  },
};

describe("Battleship", function () {
  async function deployFixture() {
    // @ts-ignore
    const [p1, p2] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();
    return { battleship, p1, p2 };
  }

  async function p2JoinedFixture() {
    // @ts-ignore
    const [p1, p2, p3] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();

    await battleship.connect(p2).p2join();
    return { battleship, p1, p2, p3 };
  }

  async function gameStartFixture() {
    // @ts-ignore
    const [p1, p2] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();
    const p2Battleship = battleship.connect(p2);

    await p2Battleship.p2join();
    await helpers.setupPlayerShips(battleship, p1);
    await helpers.setupPlayerShips(battleship, p2);
    await p2Battleship.startGame();

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

      await expect(battleship.connect(p1).p2join()).revertedWith(
        /same as player 1/
      );

      await expect(battleship.connect(p2).p2join())
        .emit(battleship, "P2Joined")
        .withArgs(p2Addr);

      expect(await battleship.p2()).equal(p2Addr);
      expect(await battleship.gameState()).equal(GameState.P2Joined);
    });
  });

  describe("Setup ships", () => {
    it("should not allow another player to setup ships", async () => {
      const { battleship, p3 } = await loadFixture(p2JoinedFixture);
      await expect(
        battleship.connect(p3).setupShips(0, [0, 0], [0, 1])
      ).revertedWith(/Not one of the game players/);
    });

    it("should not allow setting up ships with invalid parameters", async () => {
      const { battleship, p1 } = await loadFixture(p2JoinedFixture);
      const p1Addr = await p1.getAddress();

      // shipId out of bound
      const shipId = 0;
      const [totalShips, shipRows, shipCols, boardRows, boardCols] =
        await Promise.all([
          Number(await battleship.TOTAL_SHIPS()),
          Number(await battleship.SHIP_SIZES(0, 0)),
          Number(await battleship.SHIP_SIZES(0, 1)),
          Number(await battleship.BOARD_ROWS()),
          Number(await battleship.BOARD_COLS()),
        ]);

      const topLeft = [0, 0];
      const bottomRight = [shipRows - 1, shipCols - 1];
      await expect(
        battleship.connect(p1).setupShips(totalShips, topLeft, bottomRight)
      ).revertedWith(/shipId is out of bound/);

      // topLeft and bottomRight coordinate switched
      await expect(
        battleship.connect(p1).setupShips(shipId, bottomRight, topLeft)
      ).revertedWith(/topLeft .* is greater than bottomRight .*/);

      // ship placement is out of bound
      await expect(
        battleship
          .connect(p1)
          .setupShips(
            shipId,
            [boardRows - 1, boardCols - 1],
            [boardRows - 1 + bottomRight[0], boardCols - 1 + bottomRight[1]]
          )
      ).revertedWith(/ship is placed out of bound/);

      await expect(
        battleship
          .connect(p1)
          .setupShips(shipId, topLeft, [bottomRight[0], bottomRight[1] + 1])
      ).revertedWith(/ship submitted size doesn't match its expected size/);
    });

    it("should allow setting up ships with valid parameters", async () => {
      const { battleship, p2 } = await loadFixture(p2JoinedFixture);
      const shipId = 1;
      const [p2Addr, totalShips, shipRows, shipCols, boardRows, boardCols] =
        await Promise.all([
          await p2.getAddress(),
          Number(await battleship.TOTAL_SHIPS()),
          Number(await battleship.SHIP_SIZES(shipId, 0)),
          Number(await battleship.SHIP_SIZES(shipId, 1)),
          Number(await battleship.BOARD_ROWS()),
          Number(await battleship.BOARD_COLS()),
        ]);

      const topLeft = [0, 0];
      const bottomRight = [shipRows - 1, shipCols - 1];
      await expect(
        battleship.connect(p2).setupShips(shipId, topLeft, bottomRight)
      )
        .emit(battleship, "SetupShip")
        .withArgs(p2Addr, shipId);
    });

    it("should not allow game to start without both players complete setting up ships", async () => {
      const { battleship, p3 } = await loadFixture(p2JoinedFixture);

      await expect(battleship.connect(p3).startGame()).revertedWith(
        /player .* ships are not properly setup/
      );
    });

    it("should allow game to start with both players complete setting up ships", async () => {
      const { battleship, p1, p2 } = await loadFixture(p2JoinedFixture);

      await helpers.setupPlayerShips(battleship, p1);
      await helpers.setupPlayerShips(battleship, p2);
      await expect(battleship.connect(p1).startGame()).emit(
        battleship,
        "GameStart"
      );

      expect(await battleship.gameState()).to.equal(GameState.P1Move);
    });
  });

  describe("Player moves", () => {
    it("should reject moves that are out of bound", async () => {
      const { battleship, p1, p2 } = await loadFixture(gameStartFixture);

      const p1Battleship = battleship.connect(p1);
      const [boardRow, boardCol] = await Promise.all([
        p1Battleship.BOARD_ROWS(),
        p1Battleship.BOARD_COLS(),
      ]);
      await expect(p1Battleship.playerMove([boardRow, boardCol])).revertedWith(
        /move is out of bound/
      );
    });
    it("should accept move that miss");
    it("should accept move that hit");
    it("should be able to sink a ship");
    it("should end a game when all ships are sunk");
  });
});
