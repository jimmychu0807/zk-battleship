import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { readFile, writeFile } from 'node:fs/promises';

const player1Cfg = {
  nonce: 12345,
  ships: [
    [2, 2, 0],
    [4, 0, 1],
    [1, 0, 0],
    [5, 5, 1],
    [6, 3, 0],
  ],
};

const player2Cfg = {
  nonce: 22345,
  ships: [
    [2, 2, 0],
    [4, 0, 1],
    [1, 0, 0],
    [5, 5, 1],
    [6, 3, 0],
  ],
};

describe("Battleship", function () {
  it("should start game properly", async function () {
    const [acct1, acct2] = await ethers.getSigners();

    // -- deploy contract --
    const LocVerifier = await ethers.getContractFactory("contracts/LocVerifier.sol:PlonkVerifier");
    const locVerifier = await LocVerifier.deploy();
    await locVerifier.waitForDeployment();
    const locVerifierAddr = await locVerifier.getAddress();

    const Battleship = await ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy(locVerifierAddr);
    await battleship.waitForDeployment();

    // generate proof
    const proof1 = await genLocProof(player1Cfg);
    await battleship
      .connect(acct1)
      .createGame(proof1.solidityProof, proof1.signals);
    let game = await battleship.game(0);
    expect(game.player1).equal(acct1.address);
    expect(game.player2).equal(ethers.ZeroAddress);
    expect(toHex32(game.player1Hash)).equal(proof1.signals[0]);
  });
});


// utility functions
const snarkjs = require('snarkjs');

const emptyProof = `0x${'0'.repeat(64)}`;
const locWC = require('../circuits/loc_js/witness_calculator.js');
const locWasmPath = `${__dirname}/../circuits/loc.wasm`;
const locZKeyPath = `${__dirname}/../circuits/loc.zkey`;
const tmpWitnessPath ='/tmp/witness';

async function genLocProof(input: any) {
  const witnessCalc = await locWC(await readFile(locWasmPath));
  const buff = await witnessCalc.calculateWTNSBin(input);
  await writeFile(tmpWitnessPath, buff);
  const { proof, publicSignals } = await snarkjs.plonk.prove(locZKeyPath, tmpWitnessPath);

  const solidityProof = proofToSolidityInput(proof);
  return { solidityProof, signals: publicSignals.map(toHex32) };
}

function proofToSolidityInput(proof: any): string[] {
  const proofs: string[] = [
    proof.A[0], proof.A[1],
    proof.B[0], proof.B[1],
    proof.C[0], proof.C[1],
    proof.Z[0], proof.Z[1],
    proof.T1[0], proof.T1[1],
    proof.T2[0], proof.T2[1],
    proof.T3[0], proof.T3[1],
    proof.Wxi[0], proof.Wxi[1],
    proof.Wxiw[0], proof.Wxiw[1],
    proof.eval_a, proof.eval_b, proof.eval_c,
    proof.eval_s1, proof.eval_s2, proof.eval_zw,
  ];
  return proofs.map(toHex32);
}

// input: `num`: it is either BigInt, or a string of BigInt in decimal
// output: a string of `0x{0-e}` with a total lenth of 66 chars.
function toHex32(num: string | BigInt): string {
  const str = typeof num === 'string' ? BigInt(num).toString(16) : num.toString(16);
  return `0x${'0'.repeat(64 - str.length)}${str}`;
}
