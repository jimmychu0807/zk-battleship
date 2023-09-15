import * as PIXI from "pixi.js";

const GRID_ROWS = 10;
const GRID_COLS = 10;
const GRID_SIZE = 40;

const HeadingTextStyle = new PIXI.TextStyle({
  fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
  fontSize: 24,
  fontWeight: "400",
});

const SHIPS = {
  aircraftCarrier: {
    name: "Aircraft Carrier",
    path: import.meta.resolve("./assets/ships/aircraft-carrier2.png"),
    rowspan: 4,
    colspan: 2,
  },
  warship: {
    name: "Battleship",
    path: import.meta.resolve("./assets/ships/warship2.png"),
    rowspan: 5,
    colspan: 1,
  },
};

export { GRID_ROWS, GRID_COLS, GRID_SIZE, HeadingTextStyle, SHIPS };
