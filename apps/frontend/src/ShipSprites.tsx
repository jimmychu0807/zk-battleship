import { useRef, useContext } from "react";
import { Sprite, useApp } from "@pixi/react";
import * as PIXI from "pixi.js";

import { GRID_SIZE, SHIPS } from "./consts";
import { AppContext } from "./AppContext";
import { snapShipToGrid } from "./utils";

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
    if (!dragRef.current) return;

    const sprite = dragRef.current as PIXI.Sprite;

    // get mouse cursor pos
    const cursorPos = ev.global as PIXI.Point;
    // calculate the ship center point
    const shipPos = {
      x: cursorPos.x - (ship.colspan * GRID_SIZE) / 2,
      y: cursorPos.y - (ship.rowspan * GRID_SIZE) / 2,
    };
    sprite.parent.toLocal(shipPos, undefined, sprite.position);
  };

  const onDragEnd = (ev: PIXI.FederatedMouseEvent) => {
    if (!dragRef.current || !appContext) return;

    // Remove the listeners
    app.stage.off("pointermove", onDragMove);
    app.stage.off("pointerup", onDragEnd);
    app.stage.off("pointerupoutside", onDragEnd);

    const sprite = dragRef.current as PIXI.Sprite;
    dragRef.current = undefined;

    const board = appContext.appState?.board;
    if (!board) return;

    // get mouse cursor pos
    const cursorPos = ev.global as PIXI.Point;

    // If the mouse cursor is inside the board, snap the ship to the board grid
    const snapPos = snapShipToGrid(board, cursorPos, ship);
    if (snapPos) {
      sprite.alpha = 1;
      sprite.parent.toLocal(snapPos, undefined, sprite.position);
    } else {
      // otherwise remove it.
      sprite.destroy();
    }
  };

  const onDragStart = (ev: PIXI.FederatedMouseEvent) => {
    const clone = PIXI.Sprite.from(ship.path);
    clone.alpha = 0.5;
    clone.height = GRID_SIZE * ship.rowspan;
    clone.width = GRID_SIZE * ship.colspan;

    dragRef.current = clone;
    const sprite = ev.target as PIXI.Sprite;
    sprite.parent.addChild(clone);

    app.stage.on("pointermove", onDragMove);
    app.stage.on("pointerup", onDragEnd);
    app.stage.on("pointerupoutside", onDragEnd);
  };

  return (
    <Sprite
      image={ship.path}
      height={GRID_SIZE * ship.rowspan}
      width={GRID_SIZE * ship.colspan}
      x={col ? GRID_SIZE * col : x || 0}
      y={row ? GRID_SIZE * row : y || 0}
      anchor={anchor || 0}
      eventMode="static"
      blendMode={PIXI.BLEND_MODES.OVERLAY}
      onpointerdown={onDragStart}
    />
  );
}
