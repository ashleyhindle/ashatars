import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { clamp, fmt } from "./ref-geometry";

export const WAVE_TYPE = "wave";

const WAVE_COUNTS = [3, 4, 5] as const;

export function generateWave(ctx: AvatarContext): AvatarArtwork {
  const waves = ctx.rng.pick(WAVE_COUNTS);
  const baseY = ctx.rng.int(251, 350);
  const segmentWidth = ctx.size / waves;
  const commands = [`M0,${baseY}`];

  for (let index = 0; index < waves; index += 1) {
    const startX = index * segmentWidth;
    const endX = (index + 1) * segmentWidth;
    const waveHeight = ctx.rng.int(21, 200);
    const midY = clamp(index % 2 === 0 ? baseY - waveHeight : baseY + waveHeight, 0, ctx.size);
    const controlX1 = startX + segmentWidth * 0.25;
    const controlX2 = endX - segmentWidth * 0.25;

    commands.push(`C${fmt(controlX1)},${fmt(midY)} ${fmt(controlX2)},${fmt(midY)} ${fmt(endX)},${baseY}`);
  }

  return {
    layers: [
      {
        id: "wave",
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
