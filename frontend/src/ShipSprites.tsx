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
    if (!dragRef.current || !appContext) return;

    const sprite = dragRef.current as PIXI.Sprite;

    // get mouse cursor pos
    const cursorPos = ev.global as PIXI.Point;
    // calculate the ship center point
    const shipPos = cursorPos.clone();
    shipPos.x -= (ship.rowspan * GRID_SIZE) / 2;
    shipPos.y -= (ship.colspan * GRID_SIZE) / 2;

    sprite.parent.toLocal(shipPos, undefined, sprite.position);

    const board = appContext.appState?.board;
    if (!board) return;

    const boardBound = board.getLocalBounds();
    const boardPos = board.toGlobal(new PIXI.Point(0, 0));
    const boardRightBottom = {x: boardPos.x + boardBound.width, y: boardPos.y + boardBound.height};

    if (cursorPos.x > boardPos.x && cursorPos.x < boardRightBottom.x
      && cursorPos.y > boardPos.y && cursorPos.y < boardRightBottom.y) {
      console.log("ship dragged within board region");
    }
  };

  const onDragEnd = () => {
    if (dragRef.current === undefined) return;

    const sprite = dragRef.current as PIXI.Sprite;
    sprite.alpha = 1;
    dragRef.current = undefined;

    app.stage.off("pointermove", onDragMove);
    app.stage.off("pointerup", onDragEnd);
    app.stage.off("pointerupoutside", onDragEnd);
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
