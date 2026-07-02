import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { clamp, fmt } from "./ref-geometry";

export const DIAGONAL_GRID_TYPE = "diagonal_grid";

const LINE_COUNTS = [2, 3, 4, 5] as const;

type GridLine = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
};

export function generateDiagonalGrid(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(LINE_COUNTS);
  const angle = ctx.rng.int(20, 89);
  const candidates: GridLine[] = [];

  for (let index = 0; index < count; index += 1) {
    const y = ctx.rng.int(0, ctx.size);
    const x = ctx.rng.int(0, ctx.size);
    candidates.push({ x1: 0, y1: y, x2: ctx.size, y2: y }, { x1: x, y1: 0, x2: x, y2: ctx.size });
  }

  const shapes = shuffle(ctx, candidates)
    .slice(0, count)
    .map((line): AvatarShape => {
      const rotated = rotateLine(line, angle, ctx.size / 2);
      return {
        kind: "path",
        d: `M${fmt(clamp(rotated.x1, 0, ctx.size))},${fmt(clamp(rotated.y1, 0, ctx.size))} L${fmt(clamp(rotated.x2, 0, ctx.size))},${fmt(clamp(rotated.y2, 0, ctx.size))}`,
        fill: "none",
        stroke: { role: "primary" },
        strokeWidth: ctx.rng.int(10, 20),
      };
    });

  return {
    layers: [
      {
        id: "diagonal_grid",
        shapes,
      },
    ],
  };
}

function rotateLine(line: GridLine, angleDegrees: number, center: number): GridLine {
  const radians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const start = rotatePoint(line.x1, line.y1, center, cos, sin);
  const end = rotatePoint(line.x2, line.y2, center, cos, sin);

  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  };
}

function rotatePoint(x: number, y: number, center: number, cos: number, sin: number) {
  const dx = x - center;
  const dy = y - center;

  return {
    x: center + dx * cos - dy * sin,
    y: center + dx * sin + dy * cos,
  };
}

function shuffle<T>(ctx: AvatarContext, values: readonly T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = ctx.rng.int(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}
