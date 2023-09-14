import { useCallback } from "react";
import { Container, Graphics } from "@pixi/react";

import { GRID_ROWS, GRID_COLS, GRID_SIZE } from "./consts";
import ShipSprites from "./ShipSprites";

export default function BoardGrid(props: { x: number; y: number }) {
  const draw = useCallback((g) => {
    g.clear();
    g.lineStyle(2, 0xaabbcc);
    g.beginFill("navy");
    g.drawRect(0, 0, GRID_SIZE, GRID_SIZE);
    g.endFill();
  }, []);

  const grids = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      grids.push(
        <Graphics
          key={`grid-${row}-${col}`}
          x={row * GRID_SIZE}
          y={col * GRID_SIZE}
          draw={draw}
        />,
      );
    }
  }

  const { x, y } = props;

  return (
    <Container position={[x, y]}>
      {grids}
      <ShipSprites ship="aircraftCarrier" row={0} col={0} />
      <ShipSprites ship="warship" row={3} col={5} />
    </Container>
  );
}
