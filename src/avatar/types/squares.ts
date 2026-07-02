import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const SQUARES_TYPE = "squares";

const SQUARE_COUNTS = [1, 2, 3, 4] as const;

export function generateSquares(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(SQUARE_COUNTS);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const size = ctx.rng.int(41, 240);
    const x = ctx.rng.int(40, Math.max(40, ctx.size - size - 40));
    const y = ctx.rng.int(40, Math.max(40, ctx.size - size - 40));

    shapes.push({
      kind: "path",
      d: `M${x},${y} h${size} v${size} h-${size} z`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(7, 14),
    });
  }

  return {
    layers: [
      {
        id: "squares",
        shapes,
      },
    ],
  };
}
