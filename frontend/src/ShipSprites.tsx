import { useRef } from "react";
import { Sprite, useApp } from "@pixi/react";
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

  const app = useApp();
  const dragRef = useRef(null);

  const onDragMove = (ev) => {
    if (dragRef.current !== null) {
      const sprite = dragRef.current;

      // get mouse cursor pos
      const currentPt = ev.global;
      // calculate the ship center point
      currentPt.x -= (ship.rowspan * GRID_SIZE) / 2;
      currentPt.y -= (ship.colspan * GRID_SIZE) / 2;

      sprite.parent.toLocal(currentPt, null, sprite.position);
    }
  };

  const onDragEnd = () => {
    if (dragRef.current !== null) {
      const sprite = dragRef.current;
      sprite.alpha = 1;
      dragRef.current = null;

      app.stage.off("pointermove", onDragMove);
      app.stage.off("pointerup", onDragEnd);
      app.stage.off("pointerupoutside", onDragEnd);
    }
  };

  const onDragStart = (ev: PIXI.FederatedEvent) => {
    const sprite = ev.target;
    sprite.alpha = 0.5;
    dragRef.current = sprite;

    app.stage.on("pointermove", onDragMove);
    app.stage.on("pointerup", onDragEnd);
    app.stage.on("pointerupoutside", onDragEnd);
  };

  return (
    <Sprite
      image={ship.path}
      height={GRID_SIZE * ship.colspan}
      width={GRID_SIZE * ship.rowspan}
      x={col ? GRID_SIZE * col : x || 0}
      y={row ? GRID_SIZE * row : y || 0}
      anchor={anchor || 0}
      eventMode="static"
      blendMode={PIXI.BLEND_MODES.OVERLAY}
      onpointerdown={onDragStart}
    />
  );
}
