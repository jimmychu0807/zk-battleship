import { Sprite } from "@pixi/react";
import * as PIXI from "pixi.js";

import { GRID_SIZE, SHIPS } from "./consts";

interface ShipSpritesProps {
  ship: keyof typeof SHIPS;
  row?: number;
  col?: number;
  x?: number;
  y?: number;
  anchor?: number;
}

export default function ShipSprites(props: ShipSpritesProps) {
  const { ship: shipName, row, col, x, y, anchor } = props;
  const ship = SHIPS[shipName];

  return (
    <Sprite
      image={ship.path}
      height={GRID_SIZE * ship.colspan}
      width={GRID_SIZE * ship.rowspan}
      x={col ? GRID_SIZE * col : x || 0}
      y={row ? GRID_SIZE * row : y || 0}
      anchor={anchor || 0}
      blendMode={PIXI.BLEND_MODES.OVERLAY}
    />
  );
}
