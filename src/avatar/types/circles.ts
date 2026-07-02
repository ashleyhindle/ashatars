import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const CIRCLES_TYPE = "circles";

export const MIN_CIRCLES_VISIBLE_FRACTION = 0.35;

const MIN_CIRCLE_COUNT = 2;
const MAX_CIRCLE_COUNT = 7;

export function generateCircles(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.int(MIN_CIRCLE_COUNT, MAX_CIRCLE_COUNT);
  const center = ctx.size / 2;
  const visibleRadius = ctx.size / 2;
  const shapes: AvatarShape[] = [];
  const angleOffset = ctx.rng.float(0, Math.PI * 2);

  for (let index = 0; index < count; index += 1) {
    const radius = ctx.rng.int(31, 151);
    const distance = ctx.rng.float(radius * 0.1, visibleRadius + radius * 0.18);
    const angle = angleOffset + (index / count) * Math.PI * 2 + ctx.rng.float(-0.32, 0.32);

    shapes.push({
      kind: "circle",
      cx: center + Math.cos(angle) * distance,
      cy: center + Math.sin(angle) * distance,
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

export function visibleCircleFractionAfterAvatarClip(input: {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly size?: number;
}): number {
  const size = input.size ?? 512;
  const center = size / 2;
  const visibleRadius = size / 2;
  const distance = Math.hypot(input.cx - center, input.cy - center);

  if (distance + input.r <= visibleRadius) {
    return 1;
  }

  if (distance >= visibleRadius + input.r) {
    return 0;
  }

  if (distance === 0) {
    return 1;
  }

  const threshold = (visibleRadius ** 2 - distance ** 2 - input.r ** 2) / (2 * distance * input.r);
  const clamped = Math.max(-1, Math.min(1, threshold));

  return 1 - Math.acos(clamped) / Math.PI;
}
