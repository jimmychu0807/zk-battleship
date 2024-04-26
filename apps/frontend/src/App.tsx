import { useEffect, useState } from "react";
import { Stage, Text, useApp } from "@pixi/react";

import { HeadingTextStyle, GRID_COLS, GRID_SIZE } from "./consts";
import BoardGrid from "./BoardGrid";
import { AppContext, AppState } from "./AppContext";
import ShipPlate from "./ShipPlate";

function Devtool() {
  const app = useApp();
  useEffect(() => {
    // For PixiJS Devtools
    // ref: https://github.com/bfanger/pixi-inspector#pixijs
    // eslint-disable-next-line
    (globalThis as any).__PIXI_APP__ = app;
  }, [app]);

  return <></>;
}

function App() {
  let y = 0;
  const [appState, setAppState] = useState<AppState>({});

  return (
    <Stage
      options={{
        antialias: true,
        autoDensity: true,
        backgroundColor: 0xeef1f5,
        eventMode: "static",
        resizeTo: window,
      }}
      width={window.innerWidth}
      height={window.innerHeight}
    >
      <AppContext.Provider value={{ appState, setAppState }}>
        <Devtool />
        <Text text="Your board" x={0} y={y} style={HeadingTextStyle} />
        <BoardGrid x={0} y={(y += 50)} />
        <Text
          text="Your ships (pick 5 below):"
          x={0}
          y={(y += GRID_COLS * GRID_SIZE + 10)}
          style={HeadingTextStyle}
        />
        <ShipPlate x={0} y={(y += 50)} />
      </AppContext.Provider>
    </Stage>
  );
}

export default App;
