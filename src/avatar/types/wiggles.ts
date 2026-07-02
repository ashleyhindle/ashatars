import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { clamp, fmt } from "./ref-geometry";

export const WIGGLES_TYPE = "wiggles";

const WIGGLE_COUNTS = [1, 2, 3] as const;

export function generateWiggles(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(WIGGLE_COUNTS);
  const startX = ctx.rng.int(0, ctx.size);
  const stepSize = Math.round(ctx.size / count);
  const movesLeft = startX > ctx.size / 2;
  let prevX = startX;
  let prevY = 0;
  const commands = [`M${startX},0`];

  for (let index = 1; index <= count; index += 1) {
    const deltaX = ctx.rng.int(Math.trunc(stepSize / 4), Math.max(1, Math.trunc(stepSize / 2)));
    const newX = movesLeft ? prevX - deltaX : prevX + deltaX;
    const endX = clamp(newX, 0, ctx.size);
    const newY = prevY + ctx.rng.int(Math.trunc(stepSize / 2), stepSize);
    const endY = index === count ? ctx.size : clamp(newY, 0, ctx.size);
    const controlX = movesLeft
      ? endX - ctx.rng.int(150, 380)
      : endX + ctx.rng.int(150, 380);
    const controlY = endY - ctx.rng.int(100, 300);

    commands.push(`S${fmt(clamp(controlX, 0, ctx.size))},${fmt(clamp(controlY, 0, ctx.size))} ${fmt(endX)},${fmt(endY)}`);
    prevX = endX;
    prevY = endY;
  }

  return {
    layers: [
      {
        id: "wiggles",
        shapes: [
          {
            kind: "path",
            d: commands.join(" "),
            fill: "none",
            stroke: { role: "primary" },
            strokeWidth: ctx.rng.int(10, 20),
          },
        ],
      },
    ],
  };
}
