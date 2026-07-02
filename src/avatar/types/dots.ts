import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const DOTS_TYPE = "dots";

const DOT_COUNTS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_DOT_RADIUS = 18;

export function generateDots(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(DOT_COUNTS);
  const maxRadius = Math.max(28, 46 - count);
  const radius = ctx.rng.int(MIN_DOT_RADIUS, maxRadius);
  const center = ctx.size / 2;
  const safeRadius = center - radius - 28;
  const angleOffset = ctx.rng.float(0, Math.PI * 2);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = angleOffset + index * GOLDEN_ANGLE + ctx.rng.float(-0.18, 0.18);
    const radialStep = (index + ctx.rng.float(0.35, 0.95)) / count;
    const distance = safeRadius * Math.sqrt(radialStep);

    shapes.push({
      kind: "circle",
      cx: center + Math.cos(angle) * distance,
      cy: center + Math.sin(angle) * distance,
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
