import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const SUNRISE_TYPE = "sunrise";

const LINE_COUNTS = [3, 4, 5, 6] as const;

export function generateSunrise(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(LINE_COUNTS);
  const startY = ctx.rng.int(2, 50);
  const maxY = 340;
  const maxStep = Math.trunc(maxY / count);
  let currentY = startY;
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    shapes.push({
      kind: "path",
      d: `M0,${currentY} H512`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(9, 18),
    });
    currentY = Math.min(currentY + ctx.rng.int(31, Math.max(31, maxStep)), maxY);
  }

  return {
    layers: [
      {
        id: "sunrise",
        shapes,
      },
    ],
  };
}
