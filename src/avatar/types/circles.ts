import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const CIRCLES_TYPE = "circles";

const BUBBLE_ROLES = ["primary", "secondary", "accent", "soft"] as const;
const RING_ROLES = ["contrast", "primary", "secondary", "accent"] as const;

export function generateCircles(ctx: AvatarContext): AvatarArtwork {
  const largeCount = ctx.rng.int(6, 11);
  const ringCount = ctx.rng.int(5, 9);
  const accentCount = ctx.rng.int(3, 6);
  const softDiscs: AvatarShape[] = [];
  const rings: AvatarShape[] = [];
  const accents: AvatarShape[] = [];

  for (let index = 0; index < largeCount; index += 1) {
    const radius = ctx.rng.float(42, 92);
    const role =
      BUBBLE_ROLES[(index + ctx.rng.int(0, BUBBLE_ROLES.length - 1)) % BUBBLE_ROLES.length]!;

    softDiscs.push({
      kind: "circle",
      ...boundedCircle(ctx, radius),
      r: radius,
      fill: { role },
      stroke: { role: RING_ROLES[index % RING_ROLES.length]! },
      strokeWidth: ctx.rng.float(2, 6),
      opacity: ctx.rng.float(0.24, 0.5),
    });
  }

  for (let index = 0; index < ringCount; index += 1) {
    const radius = ctx.rng.float(28, 76);
    const role =
      RING_ROLES[(index + ctx.rng.int(0, RING_ROLES.length - 1)) % RING_ROLES.length]!;

    rings.push({
      kind: "circle",
      ...boundedCircle(ctx, radius),
      r: radius,
      fill: "none",
      stroke: { role },
      strokeWidth: ctx.rng.float(4, 11),
      opacity: ctx.rng.float(0.44, 0.78),
    });
  }

  for (let index = 0; index < accentCount; index += 1) {
    const radius = ctx.rng.float(10, 24);
    const role = BUBBLE_ROLES[(index + 2) % BUBBLE_ROLES.length]!;

    accents.push({
      kind: "circle",
      ...boundedCircle(ctx, radius),
      r: radius,
      fill: { role },
      opacity: ctx.rng.float(0.66, 0.92),
    });
  }

  return {
    layers: [
      {
        id: "circles-soft",
        shapes: softDiscs,
      },
      {
        id: "circles-rings",
        shapes: rings,
      },
      {
        id: "circles-accents",
        shapes: accents,
      },
    ],
  };
}

function boundedCircle(ctx: AvatarContext, radius: number): { cx: number; cy: number } {
  const padding = radius + 6;

  return {
    cx: ctx.rng.float(padding, ctx.size - padding),
    cy: ctx.rng.float(padding, ctx.size - padding),
  };
}
