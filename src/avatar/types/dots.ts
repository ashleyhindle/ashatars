import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const DOTS_TYPE = "dots";

export const DOT_COUNTS = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
] as const;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_DOT_RADIUS = 22;

export function generateDots(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(DOT_COUNTS);
  const maxRadius = Math.max(30, Math.round(54 - count * 1.2));
  const radius = ctx.rng.int(MIN_DOT_RADIUS, maxRadius);
  const center = ctx.size / 2;
  const safeRadius = center - radius - 28;
  const angleOffset = ctx.rng.float(0, Math.PI * 2);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const lowCountSpacing = count <= 5 ? (Math.PI * 2 * index) / count : index * GOLDEN_ANGLE;
    const angle = angleOffset + lowCountSpacing + ctx.rng.float(-0.16, 0.16);
    const radialStep = count <= 5 ? ctx.rng.float(0.5, 0.95) : (index + ctx.rng.float(0.35, 0.95)) / count;
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
