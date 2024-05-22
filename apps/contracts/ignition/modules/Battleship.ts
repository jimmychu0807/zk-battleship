import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { shipTypes } from "./shipTypes";

const BattleshipModule = buildModule("BattleshipModule", (m) => {
  const battleship = m.contract("Battleship", [shipTypes], {});

  return { battleship };
});

export default BattleshipModule;
