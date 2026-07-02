import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const CIRCLES_TYPE = "circles";

const CIRCLE_COUNTS = [1, 3, 4] as const;

export function generateCircles(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(CIRCLE_COUNTS);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const radius = ctx.rng.int(31, 151);
    shapes.push({
      kind: "circle",
      cx: ctx.rng.int(radius, ctx.size - radius),
      cy: ctx.rng.int(radius, ctx.size - radius),
      r: radius,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(8, 16),
    });
  }

  return {
    layers: [
      {
        id: "circles",
        shapes,
      },
    ],
  };
}
