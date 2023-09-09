import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from 'node:fs/promises';

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
    const LocVerifier = await ethers.getContractFactory("contracts/LocVerifier.sol");
    const locVerifier = await LocVerifier.deploy();
    await locVerifier.deployed();

    const Battleship = await ethers.getContractFactory("Battleship");
    const battleship = await Battleship.deploy(locVerifier.address);
    await battleship.deployed();

    // generate proof
    const proof1 = await genLocProof(player1Cfg);
    await battleship.connect(acct1)
  });
});


// utility functions
const snarkjs = require('snarkjs');

const emptyProof = '0x0000000000000000000000000000000000000000000000000000000000000000';
const locWC = require('../circuits/loc_js/witness_calculator.js');
const locWasmPath = '../circuits/loc.wasm';
const locZKeyPath = '../circuits/loc.zkey';
const WITNESS_PATH ='/tmp/witness';

async function genLocProof(input: any) {
  const buffer = await fs.readFile(locWasmPath);
  const witnessCalc = await locWC(buffer);
  const buff = await witnessCalc.calculateWTNSBin(input);
  await fs.writeFile(WITNESS_PATH, buff);
  const { proof, publicSignals } = await snarkjs.plonk.prove(locZKeyPath, WITNESS_PATH);
  const solidityProof = proofToSolidityInput(proof);
  return { solidityProof, publicSignals };
}

function proofToSolidityInput(proof: any): string {
  const proofs: string[] = [
    proof.pi_a[0], proof.pi_a[1],
    proof.pi_b[0][1], proof.pi_b[0][0],
    proof.pi_b[1][1], proof.pi_b[1][0],
    proof.pi_c[0], proof.pi_c[1],
  ];
  const flatProofs = proofs.map(p => BigInt(p));
  return `0x${flatProofs.map(x => toHex32(x )).join('')}`;
}

function toHex32(num: BigInt): string {
  let str = num.toString(16);
  while(str.length < 64) str = `0${str}`;
  return str;
}
