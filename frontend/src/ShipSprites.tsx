import { Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';

// const ASSET_PATH = path.join(__dirname, "assets");
const GRID_SIZE = 50;

interface ShipSpritesProps {
  ship: keyof typeof ships,
  row: number,
  col: number
}

const ships = {
  aircraftCarrier: {
    path: import.meta.resolve("./assets/ships/aircraft-carrier2.png"),
    rowspan: 4,
    colspan: 2,
  },
  warship: {
    path: import.meta.resolve("./assets/ships/warship2.png"),
    rowspan: 5,
    colspan: 1,
  }
};

export default function ShipSprites(props: ShipSpritesProps) {
  const { ship: shipName, row, col } = props;
  const ship = ships[shipName];

  return <Sprite
    image={ship.path}
    height={GRID_SIZE * ship.colspan}
    width={GRID_SIZE * ship.rowspan}
    x={GRID_SIZE * col}
    y={GRID_SIZE * row}
    blendMode={PIXI.BLEND_MODES.OVERLAY}
  />
}
