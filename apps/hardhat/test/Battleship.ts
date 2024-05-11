import { expect, assert } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

type BigNumberish = bigint | number;

enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Won,
  P2Won,
}

const helpers = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setupPlayerShips(battleship: any, p: any) {
    const pBattleship = battleship.connect(p);
    await pBattleship.setupShips(0, [0, 0], [0, 1]);
    await pBattleship.setupShips(1, [1, 0], [1, 2]);
    await pBattleship.setupShips(2, [2, 0], [2, 3]);
    await pBattleship.setupShips(3, [3, 0], [4, 3]);
  },

  async playerMove(
    battleship: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    p1: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    p1Moves: [BigNumberish, BigNumberish][],
    p2: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    p2Moves: [BigNumberish, BigNumberish][]
  ) {
    const p1b = battleship.connect(p1);
    const p2b = battleship.connect(p2);

    assert(
      p1Moves.length === p2Moves.length,
      "p1Moves should equal to p2Moves for this helper method"
    );
    for (let i = 0; i < p1Moves.length; i++) {
      await p1b.playerMove(p1Moves[i]);
      await p2b.playerMove(p2Moves[i]);
    }
  },
};

describe("Battleship", function () {
  async function deployFixture() {
    // @ts-expect-error seems hardhat helpers are not included
    const [p1, p2] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();
    return { battleship, p1, p2 };
  }

  async function p2JoinedFixture() {
    // @ts-expect-error seems hardhat helpers are not included
    const [p1, p2, p3] = await hre.ethers.getSigners();
    const Battleship = await hre.ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy();

    await battleship.connect(p2).p2join();
    return { battleship, p1, p2, p3 };
  }

  async function gameStartFixture() {
    // @ts-expect-error seems hardhat helpers are not included
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

      // shipId out of bound
      const shipId = 0;
      const [totalShips, shipType, boardSize] =
        await Promise.all([
          battleship.getShipTypeNum(),
          battleship.getShipType(),
          battleship.getBoardSize(),
        ]);

      const boardRows = Number(boardSize[0]);
      const boardCols = Number(boardSize[1]);

      const topLeft = [0, 0];
      const bottomRight = [
        Number(shipType[shipId].size[0]) - 1,
        Number(shipType[shipId].size[1]) - 1
      ];

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

  //   it("should allow setting up ships with valid parameters", async () => {
  //     const { battleship, p2 } = await loadFixture(p2JoinedFixture);
  //     const shipId = 1;
  //     const [p2Addr, shipRows, shipCols] = await Promise.all([
  //       p2.getAddress(),
  //       battleship.SHIP_SIZES(shipId, 0),
  //       battleship.SHIP_SIZES(shipId, 1),
  //     ]);

  //     const topLeft = [0n, 0n];
  //     const bottomRight = [shipRows - 1n, shipCols - 1n];
  //     await expect(
  //       battleship.connect(p2).setupShips(shipId, topLeft, bottomRight)
  //     )
  //       .emit(battleship, "SetupShip")
  //       .withArgs(p2Addr, shipId);
  //   });

  //   it("should not allow game to start without both players complete setting up ships", async () => {
  //     const { battleship, p3 } = await loadFixture(p2JoinedFixture);

  //     await expect(battleship.connect(p3).startGame()).revertedWith(
  //       /player .* ships are not properly setup/
  //     );
  //   });

  //   it("should allow game to start with both players complete setting up ships", async () => {
  //     const { battleship, p1, p2 } = await loadFixture(p2JoinedFixture);

  //     await helpers.setupPlayerShips(battleship, p1);
  //     await helpers.setupPlayerShips(battleship, p2);
  //     await expect(battleship.connect(p1).startGame()).emit(
  //       battleship,
  //       "GameStart"
  //     );

  //     expect(await battleship.gameState()).to.equal(GameState.P1Move);
  //   });
  // });

  // describe("Player moves", () => {
  //   it("should reject moves that are out of bound", async () => {
  //     const { battleship, p1 } = await loadFixture(gameStartFixture);
  //     const p1Battleship = battleship.connect(p1);
  //     const [boardRow, boardCol] = await Promise.all([
  //       p1Battleship.BOARD_ROWS(),
  //       p1Battleship.BOARD_COLS(),
  //     ]);

  //     await expect(p1Battleship.playerMove([boardRow, boardCol])).revertedWith(
  //       /Player move is out of bound/
  //     );
  //   });
  //   it("should accept move that miss", async () => {
  //     const { battleship, p1 } = await loadFixture(gameStartFixture);
  //     const p1Battleship = battleship.connect(p1);
  //     const [boardCol, p1Addr] = await Promise.all([
  //       p1Battleship.BOARD_COLS(),
  //       p1.getAddress(),
  //     ]);

  //     const move = [0n, boardCol - 1n];
  //     await p1Battleship.playerMove(move);

  //     // Check the state
  //     const rec = await Promise.all([
  //       battleship.moves(p1Addr, 0, 0),
  //       battleship.moves(p1Addr, 0, 1),
  //     ]);
  //     expect(rec).to.deep.equal(move);

  //     // query events in the latest block
  //     const events = await battleship.queryFilter("*", "latest");
  //     expect(events.length).to.equal(1);
  //     const event = events[0];
  //     expect(event.eventName).equal("PlayerMove");
  //     expect(event.args).deep.equal([p1Addr, move, GameState.P2Move]);
  //   });

  //   it("should accept move that hit", async () => {
  //     const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
  //     const p1Battleship = battleship.connect(p1);
  //     const [p1Addr, p2Addr] = await Promise.all([
  //       p1.getAddress(),
  //       p2.getAddress(),
  //     ]);

  //     // Hit the Cruiser
  //     const move = [1n, 0n];
  //     await p1Battleship.playerMove(move);

  //     // query events in the latest block
  //     const events = await battleship.queryFilter("*", "latest");
  //     expect(events.length).to.equal(2);
  //     const playerMoveEv = events.find((ev) => ev.eventName === "PlayerMove");
  //     expect(playerMoveEv!.args).deep.equal([p1Addr, move, GameState.P2Move]);
  //     const hitEv = events.find((ev) => ev.eventName === "Hit");
  //     expect(hitEv!.args).deep.equal([p2Addr]);

  //     // Retrieve and check the ship state
  //     const sub = await p1Battleship.ships(p2Addr, 1);
  //     expect(sub).to.deep.equal([3n, true]);
  //   });

  //   it("should be able to sink a ship", async () => {
  //     const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
  //     const p1Battleship = battleship.connect(p1);
  //     const [p2Addr, bRows, bCols] = await Promise.all([
  //       p2.getAddress(),
  //       p1Battleship.BOARD_ROWS(),
  //       p1Battleship.BOARD_COLS(),
  //     ]);

  //     // Hit two spots of the cruiser
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [[1n, 0n], [1n, 2n]],
  //       p2, Array(2).fill([bRows - 1n, bCols - 1n])
  //     );
  //     // Check the ship state
  //     let sub = await p1Battleship.ships(p2Addr, 1);
  //     expect(sub).to.deep.equal([2n, true]); // the body should be encoded as `010`.`

  //     // Hit the last spot of the cruiser
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [[1n, 1n]],
  //       p2, [[bRows - 1n, bCols - 1n]]
  //     );

  //     // query events in the last two blocks
  //     const events = await battleship.queryFilter("*", -1);
  //     expect(events.length).to.equal(3);
  //     const ev = events.find((ev) => ev.eventName === "SinkShip");
  //     expect(ev!.args).deep.equal([p2Addr, 1]); // 1 is the ID of Cruiser. Refer to SHIP_NAMES.

  //     // Check the ship state
  //     sub = await p1Battleship.ships(p2Addr, 1);
  //     expect(sub).to.deep.equal([0n, false]);
  //   });

  //   it("should end a game when all ships are sunk", async () => {
  //     const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
  //     const [p1Addr, p2Addr, bRows, bCols] = await Promise.all([
  //       p1.getAddress(),
  //       p2.getAddress(),
  //       battleship.BOARD_ROWS(),
  //       battleship.BOARD_COLS(),
  //     ]);

  //     // Hit p2 Submarine
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [[0n, 0n], [0n, 1n]],
  //       p2, Array(2).fill([bRows - 1n, bCols - 1n])
  //     );

  //     let ship = await battleship.ships(p2Addr, 0);
  //     expect(ship).to.deep.equal([0n, false]);

  //     // Hit p2 Cruiser
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [[1n, 0n], [1n, 1n], [1n, 2n]],
  //       p2, Array(3).fill([bRows - 1n, bCols - 1n])
  //     );

  //     ship = await battleship.ships(p2Addr, 1);
  //     expect(ship).to.deep.equal([0n, false]);

  //     // Hit p2 Battleship
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [[2n, 0n], [2n, 1n], [2n, 2n], [2n, 3n]],
  //       p2, Array(4).fill([bRows - 1n, bCols - 1n])
  //     );

  //     ship = await battleship.ships(p2Addr, 2);
  //     expect(ship).to.deep.equal([0n, false]);

  //     // Hit p2 Carrier
  //     // prettier-ignore
  //     await helpers.playerMove(
  //       battleship,
  //       p1, [
  //         [3n, 0n], [3n, 1n], [3n, 2n], [3n, 3n],
  //         [4n, 0n], [4n, 1n], [4n, 2n],
  //       ],
  //       p2, Array(7).fill([bRows - 1n, bCols - 1n])
  //     );

  //     const p1Battleship = battleship.connect(p1);
  //     await p1Battleship.playerMove([4n, 3n]);

  //     ship = await battleship.ships(p2Addr, 2);
  //     expect(ship).to.deep.equal([0n, false]);

  //     // Check that the game should end
  //     // query events in the last two blocks
  //     const events = await battleship.queryFilter("*", "latest");
  //     expect(events.length).equal(2);

  //     let ev = events.find((ev) => ev.eventName === "SinkShip");
  //     expect(ev!.args).deep.equal([p2Addr, 3]);

  //     ev = events.find((ev) => ev.eventName === "PlayerMove");
  //     expect(ev!.args).deep.equal([p1Addr, [4n, 3n], GameState.P1Won]);
  //   });
  });
});
