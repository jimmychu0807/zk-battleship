import * as PIXI from "pixi.js";

const GRID_ROWS = 10;
const GRID_COLS = 10;
const GRID_SIZE = 40;

const HeadingTextStyle = new PIXI.TextStyle({
  fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
  fontSize: 24,
  fontWeight: "400",
});

interface Ship {
  name: string;
  path: string;
  rowspan: number;
  colspan: number;
}

const SHIPS: { [index: string]: Ship } = {
  aircraftCarrier: {
    name: "Aircraft Carrier",
    path: "/src/assets/ships/aircraft-carrier2.png",
    rowspan: 4,
    colspan: 2,
  },
  warship: {
    name: "Battleship",
    path: "/src/assets/ships/warship2.png",
    rowspan: 5,
    colspan: 1,
  },
};

type ShipKey = keyof typeof SHIPS;

export { GRID_ROWS, GRID_COLS, GRID_SIZE, HeadingTextStyle, SHIPS };
export type { Ship, ShipKey };
