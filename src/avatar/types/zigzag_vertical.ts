import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { clamp, linePath, type Point } from "./ref-geometry";

export const ZIGZAG_VERTICAL_TYPE = "zigzag_vertical";

const ZIGZAG_COUNTS = [2, 4, 5, 6] as const;

export function generateZigzagVertical(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(ZIGZAG_COUNTS);
  const startX = ctx.rng.int(200, 500);
  const startY = ctx.rng.int(1, 25);
  const endX = ctx.rng.int(1, 50);
  const points: Point[] = [{ x: startX, y: startY }];
  let prevY = startY;

  for (let index = 0; index <= count; index += 1) {
    const y = prevY + ctx.rng.int(21, 180);
    const xVariation = ctx.rng.int(1, 50) - 25;
    const x = index % 2 === 0 ? startX - xVariation : endX - xVariation;
    points.push({ x: clamp(x, 0, ctx.size), y: clamp(y, 0, ctx.size) });
    prevY = y;
  }

  return {
    layers: [
      {
        id: "zigzag_vertical",
        shapes: [
          {
            kind: "path",
            d: linePath(points),
            fill: "none",
            stroke: { role: "primary" },
            strokeWidth: ctx.rng.int(10, 20),
          },
        ],
      },
    ],
  };
}
