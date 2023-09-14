import { Stage, Text } from "@pixi/react";
import BoardGrid from "./BoardGrid";

import "./App.css";
import { HeadingTextStyle, GRID_COLS, GRID_SIZE } from "./consts";

function App() {
  return (
    <Stage
      options={{
        antialias: true,
        autoDensity: true,
        backgroundColor: 0xeef1f5,
      }}
    >
      <Text text="Your board" x={0} y={0} style={HeadingTextStyle} />
      <BoardGrid x={0} y={50} />
      <Text
        text="Your ships (pick 5 below):"
        x={0}
        y={50 + GRID_COLS * GRID_SIZE + 10}
        style={HeadingTextStyle}
      />
    </Stage>
  );
}

export default App;
