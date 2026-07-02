import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const DOTS_TYPE = "dots";

const DOT_COUNTS = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

const ROLES = ["primary", "secondary", "accent", "soft", "contrast"] as const;

export function generateDots(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(DOT_COUNTS);
  const dotsPerSide = Math.ceil(Math.sqrt(count));
  const spacing = ctx.size / (dotsPerSide + 1);
  const baseRadius = ctx.rng.int(9, 23);
  const jitter = spacing * 0.08;
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / dotsPerSide) + 1;
    const col = (index % dotsPerSide) + 1;
    const cx = col * spacing + ctx.rng.float(-jitter, jitter);
    const cy = row * spacing + ctx.rng.float(-jitter, jitter);
    const r = baseRadius * ctx.rng.float(0.82, 1.18);
    const role = ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]!;

    shapes.push({
      kind: "circle",
      cx,
      cy,
      r,
      fill: { role },
      opacity: ctx.rng.float(0.72, 0.98),
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
