import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { fmt } from "./ref-geometry";

export const CARETS_TYPE = "carets";

const CARET_COUNTS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function generateCarets(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(CARET_COUNTS);
  const caretsPerSide = Math.ceil(Math.sqrt(count));
  const spacing = ctx.size / (caretsPerSide + 1);
  const size = ctx.rng.int(26, 60);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / caretsPerSide) + 1;
    const col = (index % caretsPerSide) + 1;
    const x = (col + 0.1) * spacing;
    const y = (row + 0.1) * spacing;

    shapes.push({
      kind: "path",
      d: `M${fmt(x - size)},${fmt(y + size)} L${fmt(x)},${fmt(y - size)} L${fmt(x + size)},${fmt(y + size)}`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(6, 12),
    });
  }

  return {
    layers: [
      {
        id: "carets",
        shapes,
      },
    ],
  };
}
