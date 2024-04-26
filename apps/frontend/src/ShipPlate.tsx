import { Container, Text } from "@pixi/react";
import ShipSprites from "./ShipSprites";
import { SHIPS } from "./consts";
import type { ShipKey } from "./consts";

export default function ShipPlate({ x, y }: { x: number; y: number }) {
  const CELL_WIDTH = 300;
  const CELL_HEIGHT = 40;
  const COL_NUM = 2;

  return (
    <Container position={[x, y]}>
      {Object.entries(SHIPS).map(([shipKey, shipVal], idx) => (
        <Container
          key={`shipPlate-${shipKey}`}
          position={[
            (idx % COL_NUM) * CELL_WIDTH,
            Math.floor(idx / COL_NUM) * CELL_HEIGHT,
          ]}
        >
          <Text text={shipVal.name} />
          <ShipSprites ship={shipKey as ShipKey} x={0} y={40} anchor={-0.1} />
        </Container>
      ))}
    </Container>
  );
}
