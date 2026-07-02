import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const GRID_TYPE = "grid";

const ROLES = ["primary", "secondary", "accent", "soft", "contrast"] as const;

export function generateGrid(ctx: AvatarContext): AvatarArtwork {
  const horizontalCount = ctx.rng.int(4, 7);
  const verticalCount = ctx.rng.int(4, 7);
  const horizontalLines = gridAxisLines(ctx, "horizontal", horizontalCount);
  const verticalLines = gridAxisLines(ctx, "vertical", verticalCount);

  return {
    layers: [
      {
        id: "grid-horizontal",
        opacity: ctx.rng.float(0.78, 0.96),
        shapes: horizontalLines,
      },
      {
        id: "grid-vertical",
        opacity: ctx.rng.float(0.72, 0.92),
        shapes: verticalLines,
      },
    ],
  };
}

function gridAxisLines(
  ctx: AvatarContext,
  axis: "horizontal" | "vertical",
  count: number,
): AvatarShape[] {
  const margin = ctx.rng.int(18, 48);
  const positions = irregularPositions(ctx, count, margin, ctx.size - margin);
  const inset = ctx.rng.int(0, 18);

  return positions.map((position, index) => {
    const wobble = ctx.rng.float(-5.5, 5.5);
    const start = Math.max(0, inset + ctx.rng.float(-8, 8));
    const end = Math.min(ctx.size, ctx.size - inset + ctx.rng.float(-8, 8));
    const role = ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]!;
    const strokeWidth = ctx.rng.float(7.5, 18);
    const opacity = ctx.rng.float(0.5, 0.86);
    const adjusted = clamp(position + wobble, 0, ctx.size);
    const d =
      axis === "horizontal"
        ? `M${start},${adjusted} L${end},${adjusted}`
        : `M${adjusted},${start} L${adjusted},${end}`;

    return {
      kind: "path",
      d,
      fill: "none",
      stroke: { role },
      strokeWidth,
      opacity,
    };
  });
}

function irregularPositions(
  ctx: AvatarContext,
  count: number,
  min: number,
  max: number,
): number[] {
  const span = max - min;
  const step = span / (count + 1);
  const jitter = step * 0.38;

  return Array.from({ length: count }, (_, index) => {
    const base = min + step * (index + 1);
    return clamp(base + ctx.rng.float(-jitter, jitter), min, max);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
