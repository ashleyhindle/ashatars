import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { clamp, linePath, type Point } from "./ref-geometry";

export const MOUNTAINS_TYPE = "mountains";

const PEAK_COUNTS = [4, 5, 6] as const;

export function generateMountains(ctx: AvatarContext): AvatarArtwork {
  const peaks = ctx.rng.pick(PEAK_COUNTS);
  const startY = ctx.rng.int(300, ctx.size);
  const endY = ctx.size - ctx.rng.int(1, 100);
  const points: Point[] = [{ x: 0, y: startY }];
  let prevX = 0;

  for (let index = 0; index <= peaks; index += 1) {
    const segmentLength = ctx.rng.int(41, 160);
    const x = prevX + segmentLength;
    const yVariation = ctx.rng.int(61, 220);
    const y = index % 2 !== 0 ? startY - yVariation : endY - yVariation;
    points.push({
      x: clamp(x, 0, ctx.size),
      y: clamp(y, 0, ctx.size),
    });
    prevX = x;
  }

  return {
    layers: [
      {
        id: "mountains",
        shapes: [
          {
            kind: "path",
            d: `${linePath(points)} L512,512`,
            fill: "none",
            stroke: { role: "primary" },
            strokeWidth: ctx.rng.int(10, 20),
          },
        ],
      },
    ],
  };
}
