import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarLayer, AvatarShape } from "../render";
import type { PaletteRole } from "../vibes";

export const WIGGLES_TYPE = "wiggles";

const LINE_ROLES = ["primary", "secondary", "accent", "contrast"] as const satisfies readonly PaletteRole[];
const SPARK_ROLES = ["accent", "soft"] as const satisfies readonly PaletteRole[];

export function generateWiggles(ctx: AvatarContext): AvatarArtwork {
  const lineCount = ctx.rng.int(4, 7);
  const segmentCount = ctx.rng.int(6, 9);
  const margin = ctx.size * 0.08;
  const laneWidth = (ctx.size - margin * 2) / Math.max(1, lineCount - 1);
  const softShapes: AvatarShape[] = [];
  const lineShapes: AvatarShape[] = [];
  const sparkShapes: AvatarShape[] = [];

  for (let line = 0; line < lineCount; line += 1) {
    const laneX = margin + laneWidth * line;
    const drift = ctx.rng.float(-laneWidth * 0.22, laneWidth * 0.22);
    const amplitude = ctx.rng.float(42, 96);
    const phase = ctx.rng.pick([-1, 1] as const);
    const startX = clamp(laneX + drift, margin, ctx.size - margin);
    const path = buildWigglePath(ctx, startX, segmentCount, amplitude, phase);
    const role = LINE_ROLES[line % LINE_ROLES.length]!;

    softShapes.push({
      kind: "path",
      d: path,
      fill: "none",
      stroke: { role: "soft" },
      strokeWidth: ctx.rng.float(18, 30),
      opacity: ctx.rng.float(0.18, 0.32),
    });

    lineShapes.push({
      kind: "path",
      d: path,
      fill: "none",
      stroke: { role },
      strokeWidth: ctx.rng.float(9, 18),
      opacity: ctx.rng.float(0.68, 0.94),
    });

    if (line % 2 === 0) {
      sparkShapes.push({
        kind: "path",
        d: buildSparkPath(ctx, startX, amplitude, phase),
        fill: "none",
        stroke: { role: SPARK_ROLES[line % SPARK_ROLES.length]! },
        strokeWidth: ctx.rng.float(4, 8),
        opacity: ctx.rng.float(0.5, 0.74),
      });
    }
  }

  const layers: AvatarLayer[] = [
    {
      id: "wiggles-soft",
      shapes: softShapes,
    },
    {
      id: "wiggles-lines",
      shapes: lineShapes,
    },
  ];

  if (sparkShapes.length > 0) {
    layers.push({
      id: "wiggles-sparks",
      shapes: sparkShapes,
    });
  }

  return {
    layers,
  };
}

function buildWigglePath(
  ctx: AvatarContext,
  startX: number,
  segmentCount: number,
  amplitude: number,
  phase: -1 | 1,
): string {
  const yStep = ctx.size / segmentCount;
  let currentX = startX;
  let currentY = 0;
  const commands = [`M${point(currentX)},${point(currentY)}`];

  for (let segment = 1; segment <= segmentCount; segment += 1) {
    const endY = segment === segmentCount ? ctx.size : yStep * segment;
    const direction = (segment % 2 === 0 ? 1 : -1) * phase;
    const sway = amplitude * ctx.rng.float(0.72, 1.18);
    const endX = clamp(startX + direction * sway * ctx.rng.float(0.16, 0.42), 0, ctx.size);
    const controlOffset = direction * sway;
    const controlYJitter = yStep * ctx.rng.float(-0.12, 0.12);
    const c1x = clamp(currentX + controlOffset, 0, ctx.size);
    const c1y = clamp(currentY + yStep * 0.36 + controlYJitter, 0, ctx.size);
    const c2x = clamp(endX - controlOffset, 0, ctx.size);
    const c2y = clamp(currentY + yStep * 0.72 - controlYJitter, 0, ctx.size);

    commands.push(
      `C${point(c1x)},${point(c1y)} ${point(c2x)},${point(c2y)} ${point(endX)},${point(endY)}`,
    );
    currentX = endX;
    currentY = endY;
  }

  return commands.join(" ");
}

function buildSparkPath(ctx: AvatarContext, startX: number, amplitude: number, phase: -1 | 1): string {
  const y = ctx.rng.float(ctx.size * 0.18, ctx.size * 0.82);
  const width = ctx.rng.float(28, 58);
  const height = ctx.rng.float(18, 42);
  const direction = ctx.rng.pick([-1, 1] as const) * phase;
  const x1 = clamp(startX - width * 0.5, 0, ctx.size);
  const x2 = clamp(startX + width * 0.5, 0, ctx.size);
  const controlX = clamp(startX + direction * amplitude * 0.24, 0, ctx.size);
  const controlY = clamp(y + direction * height, 0, ctx.size);

  return `M${point(x1)},${point(y)} Q${point(controlX)},${point(controlY)} ${point(x2)},${point(y)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function point(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
