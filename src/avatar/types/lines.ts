import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { linePath, type Point } from "./ref-geometry";

export const LINES_TYPE = "lines";

const SIDE_COUNTS = [3, 4, 5, 6, 7, 8] as const;

export function generateLines(ctx: AvatarContext): AvatarArtwork {
  const sides = ctx.rng.pick(SIDE_COUNTS);
  const points: Point[] = [];
  const shapes: AvatarShape[] = [];
  const minAngle = (20 * Math.PI) / 180;
  const maxAngle = Math.PI * 2 - minAngle;

  for (let index = 0; index < sides; index += 1) {
    const angle = minAngle + ctx.rng.next() * (maxAngle - minAngle);
    points.push({
      x: ctx.size / 2 + Math.cos(angle) * 240,
      y: ctx.size / 2 + Math.sin(angle) * 240,
    });
  }

  const strokeWidths = segmentStrokeWidths(ctx, points.length);
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    shapes.push({
      kind: "path",
      d: linePath([points[index]!, points[nextIndex]!]),
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: strokeWidths[index]!,
    });
  }

  return {
    layers: [
      {
        id: "lines",
        shapes,
      },
    ],
  };
}

function segmentStrokeWidths(ctx: AvatarContext, count: number): number[] {
  const thinIndex = ctx.rng.int(0, count - 1);
  const thickIndex = (thinIndex + 1 + ctx.rng.int(0, count - 2)) % count;

  return Array.from({ length: count }, (_, index) => {
    if (index === thinIndex) {
      return ctx.rng.int(5, 9);
    }

    if (index === thickIndex) {
      return ctx.rng.int(19, 26);
    }

    return ctx.rng.int(9, 20);
  });
}
