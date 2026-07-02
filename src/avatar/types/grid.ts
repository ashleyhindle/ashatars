import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { fmt } from "./ref-geometry";

export const GRID_TYPE = "grid";

const LINE_COUNTS = [1, 2, 3, 4, 5, 6] as const;

type AxisLine = {
  readonly axis: "horizontal" | "vertical";
  readonly position: number;
};

export function generateGrid(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(LINE_COUNTS);
  const candidates: AxisLine[] = [];

  for (let index = 0; index < count; index += 1) {
    candidates.push(
      { axis: "horizontal", position: ctx.rng.int(0, ctx.size) },
      { axis: "vertical", position: ctx.rng.int(0, ctx.size) },
    );
  }

  const selectedCount = Math.max(1, Math.floor(candidates.length * 0.7));
  const lines = shuffle(ctx, candidates).slice(0, selectedCount);
  const shapes: AvatarShape[] = lines.map((line) => ({
    kind: "path",
    d:
      line.axis === "horizontal"
        ? `M0,${fmt(line.position)} L512,${fmt(line.position)}`
        : `M${fmt(line.position)},0 L${fmt(line.position)},512`,
    fill: "none",
    stroke: { role: "primary" },
    strokeWidth: ctx.rng.int(10, 20),
  }));

  return {
    layers: [
      {
        id: "grid",
        shapes,
      },
    ],
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
