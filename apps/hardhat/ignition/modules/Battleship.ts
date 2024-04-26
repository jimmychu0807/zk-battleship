import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BattleshipModule = buildModule("BattleshipModule", (m) => {
  const battleship = m.contract("Battleship", [], {});

  return { battleship };
});

export default BattleshipModule;
