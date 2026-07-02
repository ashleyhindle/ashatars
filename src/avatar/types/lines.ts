import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { fmt, linePath, type Point } from "./ref-geometry";

export const LINES_TYPE = "lines";

const SIDE_COUNTS = [3, 4, 5, 6, 7, 8] as const;

export function generateLines(ctx: AvatarContext): AvatarArtwork {
  const sides = ctx.rng.pick(SIDE_COUNTS);
  const points: Point[] = [];
  const minAngle = (20 * Math.PI) / 180;
  const maxAngle = Math.PI * 2 - minAngle;

  for (let index = 0; index < sides; index += 1) {
    const angle = minAngle + ctx.rng.next() * (maxAngle - minAngle);
    points.push({
      x: ctx.size / 2 + Math.cos(angle) * 240,
      y: ctx.size / 2 + Math.sin(angle) * 240,
    });
  }

  return {
    layers: [
      {
        id: "lines",
        shapes: [
          {
            kind: "path",
            d: linePath(points, true),
            fill: "none",
            stroke: { role: "primary" },
            strokeWidth: Number(fmt(ctx.rng.int(7, 14))),
          },
        ],
      },
    ],
  };
}
