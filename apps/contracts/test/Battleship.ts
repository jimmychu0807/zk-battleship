import chai from "chai";
import chaiAsPromised from "chai-as-promised";

// hardhat-chai-matchers doesn't work with hardhat-viem, so we have to setup chai-as-promised
//   manually. For its usage refer to the doc:
//   https://www.chaijs.com/plugins/chai-as-promised/
chai.use(chaiAsPromised);
const expect = chai.expect;

import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { shipTypes } from "../ignition/modules/shipTypes";
import { getAddress } from "viem";

// type BigNumberish = bigint | number;

enum GameState {
  P1Joined = 0,
  P2Joined,
  P1Move,
  P2Move,
  P1Won,
  P2Won,
}

const helpers = {
  zeroAddr: "0x0000000000000000000000000000000000000000",

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setupPlayerShips(battleship: any, account: string, roundId: bigint) {
    const topLeft: [number, number] = [0, 0];
    for (let idx = 0; idx < shipTypes.length; idx++) {
      const size = shipTypes[idx].size;
      const bottomRight: [number, number] = [
        topLeft[0] + size[0] - 1,
        topLeft[1] + size[1] - 1,
      ];

      // send tx to setup the ship
      await battleship.write.setupShip([roundId, idx, topLeft, bottomRight], {
        account,
      });

      // update the topLeft to the next available row for the next ship
      topLeft[0] += size[0];
    }
  },

  // async playerMove(
  //   battleship: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  //   p1: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  //   p1Moves: [BigNumberish, BigNumberish][],
  //   p2: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  //   p2Moves: [BigNumberish, BigNumberish][]
  // ) {
  //   const p1b = battleship.connect(p1);
  //   const p2b = battleship.connect(p2);
  //   assert(
  //     p1Moves.length === p2Moves.length,
  //     "p1Moves should equal to p2Moves for this helper method"
  //   );
  //   for (let i = 0; i < p1Moves.length; i++) {
  //     await p1b.playerMove(p1Moves[i]);
  //     await p2b.playerMove(p2Moves[i]);
  //   }
  // },

  async expectEvent(
    contract: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    hash: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    eventName: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    args: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    const [ev] = await contract.getEvents.call(eventName);
    expect(hash).to.equal(ev.transactionHash);
    expect(ev.args).deep.equal(args);
  },
};

describe("Battleship", function () {
  async function deployFixture() {
    const [[p1, p2], publicClient] = await Promise.all([
      hre.viem.getWalletClients(),
      hre.viem.getPublicClient(),
    ]);

    const battleship = await hre.viem.deployContract(
      "Battleship",
      [shipTypes],
      { client: { wallet: p2 } }
    );

    return {
      battleship,
      p1: { wc: p1, addr: getAddress(p1.account.address) },
      p2: { wc: p2, addr: getAddress(p2.account.address) },
      ownerAddr: getAddress(p2.account.address),
      publicClient,
    };
  }

  async function p2JoinedFixture() {
    const [[p1, p2, p3], publicClient] = await Promise.all([
      hre.viem.getWalletClients(),
      hre.viem.getPublicClient(),
    ]);

    const [p1Addr, p2Addr] = [p1.account.address, p2.account.address];

    const battleship = await hre.viem.deployContract(
      "Battleship",
      [shipTypes],
      { client: { wallet: p2 } }
    );

    await battleship.write.newGame({ account: p1Addr });
    await battleship.write.p2join([0n], { account: p2Addr });

    return {
      battleship,
      p1: { wc: p1, addr: getAddress(p1.account.address) },
      p2: { wc: p2, addr: getAddress(p2.account.address) },
      p3: { wc: p3, addr: getAddress(p3.account.address) },
      ownerAddr: getAddress(p2.account.address),
      publicClient,
    };
  }

  async function gameStartFixture() {
    const [[p1, p2], publicClient] = await Promise.all([
      hre.viem.getWalletClients(),
      hre.viem.getPublicClient(),
    ]);

    const [p1Addr, p2Addr] = [p1.account.address, p2.account.address];
    const roundId = 0n;

    const battleship = await hre.viem.deployContract(
      "Battleship",
      [shipTypes],
      { client: { wallet: p2 } }
    );

    await battleship.write.newGame({ account: p1Addr });
    await battleship.write.p2join([roundId], { account: p2Addr });
    await helpers.setupPlayerShips(battleship, p1Addr, roundId);
    await helpers.setupPlayerShips(battleship, p2Addr, roundId);
    await battleship.write.startGame([roundId], { account: p1Addr });

    return {
      battleship,
      p1: { wc: p1, addr: getAddress(p1.account.address) },
      p2: { wc: p2, addr: getAddress(p2.account.address) },
      ownerAddr: getAddress(p2.account.address),
      publicClient,
    };
  }

  describe("Can deploy the Battleship contract", () => {
    it("should deploy a contract", async () => {
      const { battleship, ownerAddr } = await loadFixture(deployFixture);
      const owner = (await battleship.read.owner()) as string;
      expect(owner).equal(ownerAddr);
    });
  });

  describe("Can start a game and have another player join", () => {
    it("can start a new game", async () => {
      const { battleship, p1 } = await loadFixture(deployFixture);
      const { addr: p1Addr } = p1;

      // Call the newGame using p1 account
      await battleship.write.newGame({ account: p1Addr });

      // prettier-ignore
      const [roundInfo, nextRoundId] = await Promise.all([
        battleship.read.getRound([0n]),
        battleship.read.nextRoundId(),
      ]);

      expect(roundInfo).include({
        p1: p1Addr,
        p2: helpers.zeroAddr,
        state: GameState.P1Joined,
      });
      expect(roundInfo.startTime).equal(roundInfo.lastUpdate);
      expect(roundInfo.endTime).equal(0n);
      expect(nextRoundId).equal(1n);
    });

    it("another player can join", async () => {
      const { battleship, p1, p2 } = await loadFixture(deployFixture);
      const [p1Addr, p2Addr] = [p1.addr, p2.addr];

      const roundId = 0n;
      await battleship.write.newGame({ account: p1Addr });
      await battleship.write.p2join([roundId], { account: p2Addr });

      const roundInfo = await battleship.read.getRound([roundId]);
      expect(roundInfo).include({
        p1: p1Addr,
        p2: p2Addr,
        state: GameState.P2Joined,
      });
      expect(roundInfo.lastUpdate > roundInfo.startTime).true;
      expect(roundInfo.endTime).equal(0n);
    });
  });

  describe("Setup ships", () => {
    it("should not allow non-player to setup ships", async () => {
      const { battleship, p3 } = await loadFixture(p2JoinedFixture);

      const { addr: p3Addr } = p3;
      const roundId = 0n;
      const shipId = 0;

      const topLeft: [number, number] = [0, 0];
      const shipSize = shipTypes[shipId].size;
      const bottomRight: [number, number] = [shipSize[0] - 1, shipSize[1] - 1];

      await expect(
        battleship.write.setupShip([roundId, shipId, topLeft, bottomRight], {
          account: p3Addr,
        })
      ).be.rejectedWith(/Not one of the game players/);
    });

    it("should not allow setting up ships with invalid parameters", async () => {
      const { battleship, p1 } = await loadFixture(p2JoinedFixture);
      const { addr: p1Addr } = p1;

      // shipId out of bound
      const roundId = 0n;
      const shipId = 0;
      const [totalShips, shipTypes, boardSize] = await Promise.all([
        battleship.read.getShipTypeNum(),
        battleship.read.getShipTypes(),
        battleship.read.getBoardSize(),
      ]);

      const [boardRows, boardCols] = [
        Number(boardSize[0]),
        Number(boardSize[1]),
      ];
      const topLeft: [number, number] = [0, 0];
      const bottomRight: [number, number] = [
        Number(shipTypes[shipId].size[0]) - 1,
        Number(shipTypes[shipId].size[1]) - 1,
      ];

      await expect(
        battleship.write.setupShip(
          [roundId, totalShips, topLeft, bottomRight],
          {
            account: p1Addr,
          }
        )
      ).rejectedWith(/shipId is out of bound/);

      // topLeft and bottomRight coordinate switched
      await expect(
        battleship.write.setupShip([roundId, shipId, bottomRight, topLeft], {
          account: p1Addr,
        })
      ).rejectedWith(/topLeft .* is greater than bottomRight .*/);

      // ship placement is out of bound
      const oobTopLeft: [number, number] = [boardRows - 1, boardCols - 1];
      const oobBottomRight: [number, number] = [
        boardRows - 1 + bottomRight[0],
        boardCols - 1 + bottomRight[1],
      ];

      await expect(
        battleship.write.setupShip(
          [roundId, shipId, oobTopLeft, oobBottomRight],
          { account: p1Addr }
        )
      ).rejectedWith(/ship is placed out of bound/);

      await expect(
        battleship.write.setupShip(
          [roundId, shipId, topLeft, [bottomRight[0], bottomRight[1] + 1]],
          { account: p1Addr }
        )
      ).rejectedWith(/ship submitted size doesn't match its expected size/);
    });

    it("should allow setting up ships with valid parameters", async () => {
      const { battleship, p2 } = await loadFixture(p2JoinedFixture);
      const shipId = 1;
      const roundId = 0n;
      const { addr: p2Addr } = p2;

      const [shipRows, shipCols] = [
        shipTypes[shipId].size[0],
        shipTypes[shipId].size[1],
      ];

      const topLeft: [number, number] = [0, 0];
      const bottomRight: [number, number] = [shipRows - 1, shipCols - 1];
      // prettier-ignore
      const hash = await battleship.write.setupShip(
        [roundId, shipId, topLeft, bottomRight],
        { account: p2Addr }
      );

      helpers.expectEvent(battleship, hash, "SetupShip", {
        roundId,
        sender: p2Addr,
        shipId,
      });
    });

    it("should not allow game to start without both players complete setting up ships", async () => {
      const { battleship, p2 } = await loadFixture(p2JoinedFixture);
      const { addr: p2Addr } = p2;
      const roundId = 0n;

      await expect(
        battleship.write.startGame([roundId], { account: p2Addr })
      ).rejectedWith(/player .* ships are not properly setup/);
    });

    it("should allow game to start with both players complete setting up ships", async () => {
      const { battleship, p1, p2 } = await loadFixture(p2JoinedFixture);
      const [p1Addr, p2Addr] = [p1.addr, p2.addr];
      const roundId = 0n;

      await helpers.setupPlayerShips(battleship, p1Addr, roundId);
      await helpers.setupPlayerShips(battleship, p2Addr, roundId);

      // prettier-ignore
      const hash = await battleship.write.startGame([roundId], { account: p1Addr });
      helpers.expectEvent(battleship, hash, "GameStart", { roundId });

      const roundInfo = await battleship.read.getRound([roundId]);
      expect(roundInfo).to.include({
        p1: p1Addr,
        p2: p2Addr,
        state: GameState.P1Move,
      });
    });
  });

  describe("Player moves", () => {
    it("should reject moves that are out of bound", async () => {
      const { battleship, p1 } = await loadFixture(gameStartFixture);
      const roundId = 0n;
      const { addr: account } = p1;

      const [boardRow, boardCol] = await battleship.read.getBoardSize();

      // prettier-ignore
      await expect(battleship.write.playerMove(
        [roundId, [boardRow, boardCol]],
        { account }
      )).rejectedWith(/Player move is out of bound/);
    });

    it("should accept move that miss", async () => {
      const { battleship, p1 } = await loadFixture(gameStartFixture);
      const roundId = 0n;
      const { addr: account } = p1;

      const [boardRow, boardCol] = await battleship.read.getBoardSize();

      const move: [number, number] = [boardRow - 1, boardCol - 1];
      // prettier-ignore
      const hash = await battleship.write.playerMove([roundId, move], { account });

      // Check the game state, move list, and event
      const [roundInfo, moves] = await Promise.all([
        battleship.read.getRound([roundId]),
        battleship.read.getRoundMoves([roundId, account]),
      ]);

      expect(roundInfo.state).equal(GameState.P2Move);
      expect(moves).deep.equal([move]);
      // prettier-ignore
      helpers.expectEvent(
        battleship, hash, "PlayerMove",
        { roundId, sender: account, hitRC: move, gameState: GameState.P2Move }
      );
    });

    it("should accept move that hit", async () => {
      const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
      const roundId = 0n;
      const { addr: account } = p1;
      const p2Addr = p2.addr;

      let ships = await battleship.read.getRoundShips([roundId, p2Addr]);
      expect(ships[1].body).equal(7n);

      // Hit the Cruiser
      const move: [number, number] = [1, 0];
      // prettier-ignore
      const hash = await battleship.write.playerMove([roundId, move], { account });

      // Check two events are emitted
      // prettier-ignore
      helpers.expectEvent(
        battleship, hash, "PlayerMove",
        { roundId, sender: account, hitRC: move, gameState: GameState.P2Move }
      );
      // prettier-ignore
      helpers.expectEvent(
        battleship, hash, "Hit",
        { roundId, opponent: p2Addr }
      );

      // Retrieve and check the ship state
      ships = await battleship.read.getRoundShips([roundId, p2Addr]);
      // we know we hit the first spot of the ship. As a result, the ship body value
      //   changes from 7 `111` to 3 `011`.
      expect(ships[1].body).equal(3n);
    });

    // it("should be able to sink a ship", async () => {
    //   const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
    //   const p1Battleship = battleship.connect(p1);
    //   const [p2Addr, bRows, bCols] = await Promise.all([
    //     p2.getAddress(),
    //     p1Battleship.BOARD_ROWS(),
    //     p1Battleship.BOARD_COLS(),
    //   ]);

    //   // Hit two spots of the cruiser
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [[1n, 0n], [1n, 2n]],
    //     p2, Array(2).fill([bRows - 1n, bCols - 1n])
    //   );
    //   // Check the ship state
    //   let sub = await p1Battleship.ships(p2Addr, 1);
    //   expect(sub).to.deep.equal([2n, true]); // the body should be encoded as `010`.`

    //   // Hit the last spot of the cruiser
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [[1n, 1n]],
    //     p2, [[bRows - 1n, bCols - 1n]]
    //   );

    //   // query events in the last two blocks
    //   const events = await battleship.queryFilter("*", -1);
    //   expect(events.length).to.equal(3);
    //   const ev = events.find((ev) => ev.eventName === "SinkShip");
    //   expect(ev!.args).deep.equal([p2Addr, 1]); // 1 is the ID of Cruiser. Refer to SHIP_NAMES.

    //   // Check the ship state
    //   sub = await p1Battleship.ships(p2Addr, 1);
    //   expect(sub).to.deep.equal([0n, false]);
    // });

    // it("should end a game when all ships are sunk", async () => {
    //   const { battleship, p1, p2 } = await loadFixture(gameStartFixture);
    //   const [p1Addr, p2Addr, bRows, bCols] = await Promise.all([
    //     p1.getAddress(),
    //     p2.getAddress(),
    //     battleship.BOARD_ROWS(),
    //     battleship.BOARD_COLS(),
    //   ]);

    //   // Hit p2 Submarine
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [[0n, 0n], [0n, 1n]],
    //     p2, Array(2).fill([bRows - 1n, bCols - 1n])
    //   );

    //   let ship = await battleship.ships(p2Addr, 0);
    //   expect(ship).to.deep.equal([0n, false]);

    //   // Hit p2 Cruiser
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [[1n, 0n], [1n, 1n], [1n, 2n]],
    //     p2, Array(3).fill([bRows - 1n, bCols - 1n])
    //   );

    //   ship = await battleship.ships(p2Addr, 1);
    //   expect(ship).to.deep.equal([0n, false]);

    //   // Hit p2 Battleship
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [[2n, 0n], [2n, 1n], [2n, 2n], [2n, 3n]],
    //     p2, Array(4).fill([bRows - 1n, bCols - 1n])
    //   );

    //   ship = await battleship.ships(p2Addr, 2);
    //   expect(ship).to.deep.equal([0n, false]);

    //   // Hit p2 Carrier
    //   // prettier-ignore
    //   await helpers.playerMove(
    //     battleship,
    //     p1, [
    //       [3n, 0n], [3n, 1n], [3n, 2n], [3n, 3n],
    //       [4n, 0n], [4n, 1n], [4n, 2n],
    //     ],
    //     p2, Array(7).fill([bRows - 1n, bCols - 1n])
    //   );

    //   const p1Battleship = battleship.connect(p1);
    //   await p1Battleship.playerMove([4n, 3n]);

    //   ship = await battleship.ships(p2Addr, 2);
    //   expect(ship).to.deep.equal([0n, false]);

    //   // Check that the game should end
    //   // query events in the last two blocks
    //   const events = await battleship.queryFilter("*", "latest");
    //   expect(events.length).equal(2);

    //   let ev = events.find((ev) => ev.eventName === "SinkShip");
    //   expect(ev!.args).deep.equal([p2Addr, 3]);

    //   ev = events.find((ev) => ev.eventName === "PlayerMove");
    //   expect(ev!.args).deep.equal([p1Addr, [4n, 3n], GameState.P1Won]);
    // });
  });
});
