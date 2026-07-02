import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarLayer, AvatarShape } from "../render";

export const MOUNTAINS_TYPE = "mountains";

const BAND_ROLES = ["soft", "secondary", "primary"] as const;
const RIDGE_STROKE_ROLES = ["accent", "contrast", "soft"] as const;

interface Point {
  readonly x: number;
  readonly y: number;
}

export function generateMountains(ctx: AvatarContext): AvatarArtwork {
  const layerCount = ctx.rng.int(3, 4);
  const layers: AvatarLayer[] = [];

  for (let index = 0; index < layerCount; index += 1) {
    const depth = index / Math.max(1, layerCount - 1);
    const horizon = ctx.size * (0.46 + depth * 0.2) + ctx.rng.float(-18, 18);
    const amplitude = ctx.size * (0.13 - depth * 0.025) + ctx.rng.float(-8, 10);
    const points = ridgePoints(ctx, horizon, amplitude, 5 + index + ctx.rng.int(0, 1));
    const floor = ctx.size;
    const fillRole = BAND_ROLES[index % BAND_ROLES.length]!;
    const strokeRole = RIDGE_STROKE_ROLES[index % RIDGE_STROKE_ROLES.length]!;
    const ridgePath = toRidgePath(points, floor);

    layers.push({
      id: `mountain-band-${index + 1}`,
      opacity: 0.54 + depth * 0.18,
      shapes: [
        {
          kind: "path",
          d: ridgePath,
          fill: { role: fillRole },
          stroke: { role: strokeRole },
          strokeWidth: 5 - index,
          opacity: 0.92,
        },
      ],
    });
  }

  const capShapes = snowCapShapes(ctx, layers[0]?.shapes[0]);
  if (capShapes.length > 0) {
    layers.push({
      id: "mountain-caps",
      opacity: 0.72,
      shapes: capShapes,
    });
  }

  return { layers };
}

function ridgePoints(ctx: AvatarContext, horizon: number, amplitude: number, peakCount: number): Point[] {
  const points: Point[] = [{ x: 0, y: clamp(horizon + ctx.rng.float(20, 54), 60, ctx.size - 42) }];
  const segment = ctx.size / peakCount;

  for (let index = 1; index < peakCount; index += 1) {
    const x = segment * index + ctx.rng.float(-18, 18);
    const isPeak = index % 2 === 1;
    const y = isPeak
      ? horizon - amplitude * ctx.rng.float(0.64, 1.22)
      : horizon + amplitude * ctx.rng.float(0.15, 0.62);

    points.push({
      x: clamp(x, 0, ctx.size),
      y: clamp(y, 44, ctx.size - 74),
    });
  }

  points.push({ x: ctx.size, y: clamp(horizon + ctx.rng.float(12, 48), 70, ctx.size - 34) });
  return points;
}

function snowCapShapes(ctx: AvatarContext, firstBand: AvatarShape | undefined): AvatarShape[] {
  if (!firstBand || firstBand.kind !== "path") {
    return [];
  }

  const peaks = firstBand.d
    .match(/-?\d+,-?\d+/g)
    ?.map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x: x ?? 0, y: y ?? 0 };
    })
    .filter((point) => point.x > 20 && point.x < ctx.size - 20 && point.y > 30 && point.y < ctx.size * 0.52)
    .sort((a, b) => a.y - b.y)
    .slice(0, 3);

  if (!peaks) {
    return [];
  }

  return peaks.map((peak, index) => {
    const capWidth = ctx.rng.int(20, 34);
    const capHeight = ctx.rng.int(24, 38);
    const left = { x: clamp(peak.x - capWidth, 0, ctx.size), y: clamp(peak.y + capHeight, 0, ctx.size) };
    const right = {
      x: clamp(peak.x + capWidth, 0, ctx.size),
      y: clamp(peak.y + capHeight + ctx.rng.int(-4, 5), 0, ctx.size),
    };
    const notch = {
      x: clamp(peak.x + ctx.rng.int(-6, 7), 0, ctx.size),
      y: clamp(peak.y + capHeight * ctx.rng.float(0.48, 0.72), 0, ctx.size),
    };

    return {
      kind: "path",
      id: `mountain-cap-${index + 1}`,
      d: `M${round(peak.x)},${round(peak.y)} L${round(left.x)},${round(left.y)} L${round(notch.x)},${round(notch.y)} L${round(right.x)},${round(right.y)} Z`,
      fill: { role: "contrast" },
      opacity: ctx.rng.float(0.36, 0.58),
    };
  });
}

function toRidgePath(points: readonly Point[], floor: number): string {
  const ridge = points.map((point) => `${round(point.x)},${round(point.y)}`).join(" L");
  const first = points[0]!;
  const last = points[points.length - 1]!;

  return `M${ridge} L${round(last.x)},${round(floor)} L${round(first.x)},${round(floor)} Z`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}
