import {
  useCallback,
  useRef,
  useContext,
  useEffect,
  ComponentProps,
} from "react";
import { Container, Graphics, PixiRef } from "@pixi/react";

import { GRID_ROWS, GRID_COLS, GRID_SIZE } from "./consts";
import { AppContext } from "./AppContext";

type IContainer = PixiRef<typeof Container>;
type DrawType = NonNullable<ComponentProps<typeof Graphics>["draw"]>;

export default function BoardGrid(props: { x: number; y: number }) {
  const boardRef = useRef<IContainer>(null);
  const appContext = useContext(AppContext);

  useEffect(() => {
    if (appContext && boardRef.current) {
      const { appState, setAppState } = appContext;
      setAppState({ ...appState, board: boardRef.current });
    }
  }, [boardRef]);

  const draw = useCallback<DrawType>((g) => {
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
    <Container position={[x, y]} ref={boardRef}>
      <Container key="board-grid" position={[0,0]}>
        {grids}
      </Container>
      <Container key="board-ships" position={[0,0]}>
      </Container>
    </Container>
  );
}
