import * as PIXI from "pixi.js";

const GRID_ROWS = 10;
const GRID_COLS = 10;
const GRID_SIZE = 40;

const HeadingTextStyle = new PIXI.TextStyle({
  fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
  fontSize: 24,
  fontWeight: "400",
});

export { GRID_ROWS, GRID_COLS, GRID_SIZE, HeadingTextStyle };
