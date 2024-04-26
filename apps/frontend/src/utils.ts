import { IPointData, Container, Point } from "pixi.js";
import { GRID_SIZE, GRID_ROWS, GRID_COLS } from "./consts";
import type { Ship } from "./consts";

export function snapShipToGrid(
  board: Container,
  cursorPos: IPointData, // in global coordinate
  ship: Ship,
): IPointData | undefined {
  // Calculate the board grid bound
  const boardBound = board.getLocalBounds();
  const boardTopLeft = board.toGlobal(new Point(0, 0));
  const boardBottomRight = {
    x: boardTopLeft.x + boardBound.width,
    y: boardTopLeft.y + boardBound.height,
  };

  if (
    cursorPos.x > boardTopLeft.x &&
    cursorPos.x < boardBottomRight.x &&
    cursorPos.y > boardTopLeft.y &&
    cursorPos.y < boardBottomRight.y
  ) {
    // The cursor is inside the board. The cursor position is at the center of the ship. Now we
    // want to get the top left position of the ship.
    const shipTopLeft = {
      x: cursorPos.x - (ship.colspan * GRID_SIZE) / 2,
      y: cursorPos.y - (ship.rowspan * GRID_SIZE) / 2,
    };

    const colNum = Math.min(
      Math.floor(Math.max(0, shipTopLeft.x - boardTopLeft.x) / GRID_SIZE),
      GRID_ROWS - ship.colspan, // ensure the whole ship is still within the board bound
    );
    const rowNum = Math.min(
      Math.floor(Math.max(0, shipTopLeft.y - boardTopLeft.y) / GRID_SIZE),
      GRID_COLS - ship.rowspan, // ensure the whole ship is still within the board bound
    );

    return {
      x: boardTopLeft.x + colNum * GRID_SIZE,
      y: boardTopLeft.y + rowNum * GRID_SIZE,
    };
  }

  return undefined;
}
