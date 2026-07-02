import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const ZIGZAG_VERTICAL_TYPE = "zigzag_vertical";

const STROKE_ROLES = ["primary", "secondary", "accent", "soft", "contrast"] as const;

type Point = readonly [number, number];
type StrokeRole = (typeof STROKE_ROLES)[number];

export function generateZigzagVertical(ctx: AvatarContext): AvatarArtwork {
  const segmentCount = ctx.rng.int(6, 9);
  const top = ctx.rng.int(12, 32);
  const bottom = ctx.size - ctx.rng.int(12, 32);
  const centerX = ctx.rng.int(216, 296);
  const amplitude = ctx.rng.int(92, 148);
  const jitterX = ctx.rng.int(8, 24);
  const leftX = clamp(centerX - amplitude, 28, ctx.size - 28);
  const rightX = clamp(centerX + amplitude, 28, ctx.size - 28);
  const startOnRight = ctx.rng.int(0, 1) === 1;
  const points: Point[] = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const edgeX = (index % 2 === 0) === startOnRight ? rightX : leftX;
    const yJitter = index === 0 || index === segmentCount ? 0 : ctx.rng.float(-10, 10);
    const x = clamp(edgeX + ctx.rng.float(-jitterX, jitterX), 24, ctx.size - 24);
    const y = clamp(top + (bottom - top) * progress + yJitter, 10, ctx.size - 10);
    points.push([x, y]);
  }

  const echoOffset = ctx.rng.int(16, 28);
  const accentOffset = ctx.rng.pick([-1, 1]) * ctx.rng.int(6, 12);
  const secondaryRole = STROKE_ROLES[ctx.rng.int(1, STROKE_ROLES.length - 1)]!;

  return {
    layers: [
      {
        id: "zigzag_vertical_echo",
        opacity: 0.5,
        shapes: [
          strokePath(offsetPoints(points, -echoOffset, ctx.size), "soft", 24),
          strokePath(offsetPoints(points, echoOffset, ctx.size), "contrast", 16, 0.36),
        ],
      },
      {
        id: "zigzag_vertical_main",
        shapes: [strokePath(points, "primary", 15, 0.94)],
      },
      {
        id: "zigzag_vertical_highlight",
        shapes: [
          strokePath(offsetPoints(points, accentOffset, ctx.size), secondaryRole, 5, 0.82),
          strokePath(offsetPoints(points, -accentOffset * 0.6, ctx.size), "accent", 3, 0.72),
        ],
      },
    ],
  };
}

function strokePath(
  points: readonly Point[],
  role: StrokeRole,
  strokeWidth: number,
  opacity?: number,
): AvatarShape {
  return {
    kind: "path",
    d: pointsToPath(points),
    fill: "none",
    stroke: { role },
    strokeWidth,
    opacity,
  };
}

function pointsToPath(points: readonly Point[]): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${formatPathNumber(x)},${formatPathNumber(y)}`)
    .join(" ");
}

function offsetPoints(points: readonly Point[], dx: number, size: number): Point[] {
  return points.map(([x, y]) => [clamp(x + dx, 16, size - 16), y]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatPathNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/0$/, "").replace(/\.$/, "");
}
