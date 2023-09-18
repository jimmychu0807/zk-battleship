import { useRef, useContext } from "react";
import { Sprite, useApp } from "@pixi/react";
import * as PIXI from "pixi.js";

import { GRID_SIZE, SHIPS } from "./consts";
import { AppContext } from "./AppContext";

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
  const dragRef = useRef<undefined | PIXI.Sprite>(undefined);
  const appContext = useContext(AppContext);

  const onDragMove = (ev: PIXI.FederatedMouseEvent) => {
    if (dragRef.current && appContext) {
      const sprite = dragRef.current as PIXI.Sprite;

      // get mouse cursor pos
      const currentPt = ev.global as PIXI.IPoint;
      // calculate the ship center point
      currentPt.x -= (ship.rowspan * GRID_SIZE) / 2;
      currentPt.y -= (ship.colspan * GRID_SIZE) / 2;

      sprite.parent.toLocal(currentPt, undefined, sprite.position);

      const { appState } = appContext;
      const { board } = appState;
      const bounds = board!.getBounds();
      console.log("sprite pos", sprite.position);
      console.log("bounds", bounds);
    }
  };

  const onDragEnd = () => {
    if (dragRef.current !== undefined) {
      const sprite = dragRef.current as PIXI.Sprite;
      sprite.alpha = 1;
      dragRef.current = undefined;

      app.stage.off("pointermove", onDragMove);
      app.stage.off("pointerup", onDragEnd);
      app.stage.off("pointerupoutside", onDragEnd);
    }
  };

  const onDragStart = (ev: PIXI.FederatedMouseEvent) => {
    const sprite = ev.target as PIXI.Sprite;
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
