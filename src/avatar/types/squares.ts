import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const SQUARES_TYPE = "squares";

const SQUARE_COUNTS = [2, 3, 4, 5] as const;

export function generateSquares(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(SQUARE_COUNTS);
  const shapes: AvatarShape[] = [];
  const strokeWidths = variedStrokeWidths(ctx, count);

  for (let index = 0; index < count; index += 1) {
    const size = ctx.rng.int(41, 240);
    const x = ctx.rng.int(40, Math.max(40, ctx.size - size - 40));
    const y = ctx.rng.int(40, Math.max(40, ctx.size - size - 40));

    shapes.push({
      kind: "path",
      d: `M${x},${y} h${size} v${size} h-${size} z`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: strokeWidths[index]!,
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

function variedStrokeWidths(ctx: AvatarContext, count: number): number[] {
  const thin = ctx.rng.int(5, 9);
  const thick = ctx.rng.int(22, 30);
  const rotation = ctx.rng.int(0, count - 1);

  return Array.from({ length: count }, (_, index) => {
    const sortedIndex = (index + rotation) % count;
    const t = count === 1 ? 0 : sortedIndex / (count - 1);
    const jitter = sortedIndex === 0 || sortedIndex === count - 1 ? 0 : ctx.rng.int(-2, 2);

    return Math.max(4, Math.round(thin + (thick - thin) * t + jitter));
  });
}
