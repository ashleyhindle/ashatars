import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import type { PaletteRole } from "../vibes";

export const SUNRISE_TYPE = "sunrise";

const BAND_ROLES = [
  "secondary",
  "soft",
  "accent",
  "contrast",
] as const satisfies readonly PaletteRole[];
const RAY_ROLES = [
  "soft",
  "accent",
  "secondary",
] as const satisfies readonly PaletteRole[];

export function generateSunrise(ctx: AvatarContext): AvatarArtwork {
  const horizonY = ctx.rng.int(292, 350);
  const sunRadius = ctx.rng.int(76, 118);
  const sunInset = Math.ceil(sunRadius / 2);
  const sunCx = ctx.rng.int(184 + sunInset, 328 - sunInset);
  const bandShapes = generateHorizonBands(ctx, horizonY);
  const rayShapes = generateRays(ctx, sunCx, horizonY, sunRadius);
  const reflectionShapes = generateReflections(ctx, sunCx, horizonY, sunRadius);

  return {
    layers: [
      {
        id: "sunrise-rays",
        opacity: 0.58,
        shapes: rayShapes,
      },
      {
        id: "sunrise-sun",
        shapes: [
          {
            kind: "path",
            d: arcPath(
              sunCx - sunRadius,
              horizonY,
              sunRadius,
              sunCx + sunRadius,
              horizonY,
            ),
            fill: { role: "primary" },
            opacity: ctx.rng.float(0.82, 0.96),
          },
        ],
      },
      {
        id: "sunrise-bands",
        shapes: bandShapes,
      },
      {
        id: "sunrise-reflections",
        opacity: 0.78,
        shapes: reflectionShapes,
      },
    ],
  };
}

function generateHorizonBands(ctx: AvatarContext, horizonY: number): AvatarShape[] {
  const count = ctx.rng.int(4, 7);
  const topY = ctx.rng.int(34, 62);
  const maxY = Math.min(382, horizonY + ctx.rng.int(24, 42));
  const step = (maxY - topY) / count;
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const y = Math.round(topY + step * index + ctx.rng.float(-9, 9));
    const role =
      BAND_ROLES[(index + ctx.rng.int(0, BAND_ROLES.length - 1)) % BAND_ROLES.length]!;

    shapes.push({
      kind: "path",
      d: `M0,${clamp(y, 18, 402)} H512`,
      fill: "none",
      stroke: { role },
      strokeWidth: ctx.rng.int(5, 15),
      opacity: ctx.rng.float(0.34, 0.74),
    });
  }

  shapes.push({
    kind: "path",
    d: `M0,${horizonY} H512`,
    fill: "none",
    stroke: { role: "contrast" },
    strokeWidth: ctx.rng.int(7, 13),
    opacity: 0.54,
  });

  return shapes;
}

function generateRays(
  ctx: AvatarContext,
  sunCx: number,
  horizonY: number,
  sunRadius: number,
): AvatarShape[] {
  const count = ctx.rng.int(5, 8);
  const spread = 132;
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const x = Math.round(sunCx - spread + spread * 2 * t + ctx.rng.float(-16, 16));
    const y = ctx.rng.int(28, Math.max(72, horizonY - sunRadius - 18));
    const startX = Math.round(sunCx + (x - sunCx) * 0.24);
    const startY = Math.round(horizonY - sunRadius * ctx.rng.float(0.28, 0.52));
    const role =
      RAY_ROLES[(index + ctx.rng.int(0, RAY_ROLES.length - 1)) % RAY_ROLES.length]!;

    shapes.push({
      kind: "path",
      d: `M${startX},${startY} L${clamp(x, 18, 494)},${y}`,
      fill: "none",
      stroke: { role },
      strokeWidth: ctx.rng.int(4, 9),
      opacity: ctx.rng.float(0.28, 0.54),
    });
  }

  return shapes;
}

function generateReflections(
  ctx: AvatarContext,
  sunCx: number,
  horizonY: number,
  sunRadius: number,
): AvatarShape[] {
  const count = ctx.rng.int(3, 5);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const y = horizonY + 24 + index * ctx.rng.int(18, 28);
    const width = Math.round(sunRadius * ctx.rng.float(0.72, 1.42) - index * 10);
    const x1 = clamp(Math.round(sunCx - width), 18, 492);
    const x2 = clamp(Math.round(sunCx + width), 20, 494);

    shapes.push({
      kind: "path",
      d: `M${x1},${clamp(y, horizonY + 12, 472)} H${Math.max(x1 + 8, x2)}`,
      fill: "none",
      stroke: { role: index % 2 === 0 ? "primary" : "accent" },
      strokeWidth: ctx.rng.int(4, 10),
      opacity: ctx.rng.float(0.32, 0.64),
    });
  }

  return shapes;
}

function arcPath(
  x1: number,
  y1: number,
  radius: number,
  x2: number,
  y2: number,
): string {
  const baseline = y1 + 3;

  return `M${Math.round(x1)},${y1} A${radius},${radius} 0 0 1 ${Math.round(
    x2,
  )},${y2} L${Math.round(x2)},${baseline} L${Math.round(x1)},${baseline} Z`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
