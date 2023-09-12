import { useCallback } from 'react'
import { Graphics } from '@pixi/react';

const GRID_ROWS = 9;
const GRID_COLS = 9;
const GRID_SIZE = 50;

export default function BoardGrid() {
  const draw = useCallback((g: any) => {
    g.clear();
    g.lineStyle(2, 0xAABBCC);
    g.beginFill('navy');
    g.drawRect(0, 0, GRID_SIZE, GRID_SIZE);
    g.endFill();
  }, []);

  const grids = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      grids.push(<Graphics
        key={`grid-${row}-${col}`}
        x={row * GRID_SIZE}
        y={col * GRID_SIZE}
        draw={draw}
      />);
    }
  }

  return <>
    { grids }
  </>;
}

