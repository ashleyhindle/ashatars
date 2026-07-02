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
  const strokeWidths = variedStrokeWidths(ctx, count);

  for (let index = 0; index < count; index += 1) {
    shapes.push({
      kind: "path",
      d: `M0,${currentY} H512`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: strokeWidths[index]!,
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

function variedStrokeWidths(ctx: AvatarContext, count: number): number[] {
  const thin = ctx.rng.int(5, 9);
  const thick = ctx.rng.int(24, 32);
  const rotation = ctx.rng.int(0, count - 1);

  return Array.from({ length: count }, (_, index) => {
    const sortedIndex = count === 1 ? 0 : (index + rotation) % count;
    const t = count === 1 ? 0 : sortedIndex / (count - 1);
    const jitter = index === 0 || index === count - 1 ? 0 : ctx.rng.int(-2, 2);

    return Math.max(4, Math.round(thin + (thick - thin) * t + jitter));
  });
}
