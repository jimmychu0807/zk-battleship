import { Stage, Text } from "@pixi/react";

import { HeadingTextStyle, GRID_COLS, GRID_SIZE } from "./consts";
import BoardGrid from "./BoardGrid";
import ShipPlate from "./ShipPlate";

function App() {
  let y = 0;

  return (
    <Stage
      options={{
        antialias: true,
        autoDensity: true,
        backgroundColor: 0xeef1f5,
        eventMode: 'static',
        resizeTo: window,
      }}
      width={window.innerWidth}
      height={window.innerHeight}
    >
      <Text text="Your board" x={0} y={y} style={HeadingTextStyle} />
      <BoardGrid x={0} y={(y += 50)} />
      <Text
        text="Your ships (pick 5 below):"
        x={0}
        y={(y += GRID_COLS * GRID_SIZE + 10)}
        style={HeadingTextStyle}
      />
      <ShipPlate x={0} y={(y += 50)} />
    </Stage>
  );
}

export default App;
