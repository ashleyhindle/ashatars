import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const DOTS_TYPE = "dots";

const DOT_COUNTS = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

export function generateDots(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(DOT_COUNTS);
  const dotsPerSide = Math.ceil(Math.sqrt(count));
  const spacing = ctx.size / (dotsPerSide + 1);
  const radius = ctx.rng.int(2, 21);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / dotsPerSide) + 1;
    const col = (index % dotsPerSide) + 1;

    shapes.push({
      kind: "circle",
      cx: (col - 0.5) * spacing,
      cy: (row - 0.5) * spacing,
      r: radius,
      fill: { role: "primary" },
    });
  }

  return {
    layers: [
      {
        id: "dots",
        shapes,
      },
    ],
  };
}
