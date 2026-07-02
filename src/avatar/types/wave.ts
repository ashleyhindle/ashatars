import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarLayer, Paint } from "../render";
import type { PaletteRole } from "../vibes";

export const WAVE_TYPE = "wave";

const WAVE_ROLES = ["soft", "secondary", "primary"] as const satisfies readonly PaletteRole[];
const CREST_ROLES = ["accent", "contrast"] as const satisfies readonly PaletteRole[];

interface WaveBandConfig {
  readonly id: string;
  readonly baseY: number;
  readonly amplitude: number;
  readonly waves: number;
  readonly fill: Paint;
  readonly opacity: number;
  readonly phase: number;
}

export function generateWave(ctx: AvatarContext): AvatarArtwork {
  const horizon = ctx.rng.float(224, 278);
  const swell = ctx.rng.float(0.86, 1.22);
  const layers: AvatarLayer[] = [];

  for (let index = 0; index < 3; index += 1) {
    const baseY = horizon + index * ctx.rng.float(50, 66);
    const waves = ctx.rng.int(3, 5 + index);
    const amplitude = ctx.rng.float(34 + index * 14, 72 + index * 22) * swell;
    const phase = ctx.rng.int(0, 1);

    layers.push(
      waveBand(ctx, {
        id: `wave-band-${index + 1}`,
        baseY,
        amplitude,
        waves,
        fill: { role: WAVE_ROLES[index]! },
        opacity: 0.58 + index * 0.13,
        phase,
      }),
    );
  }

  const crestBaseY = horizon + ctx.rng.float(90, 132);
  layers.push({
    id: "wave-crests",
    opacity: ctx.rng.float(0.58, 0.78),
    shapes: [
      {
        kind: "path",
        d: waveLinePath(
          ctx,
          crestBaseY,
          ctx.rng.float(42, 76) * swell,
          ctx.rng.int(4, 7),
          ctx.rng.int(0, 1),
        ),
        fill: "none",
        stroke: { role: ctx.rng.pick(CREST_ROLES) },
        strokeWidth: ctx.rng.float(7, 13),
      },
    ],
  });

  return { layers };
}

function waveBand(ctx: AvatarContext, config: WaveBandConfig): AvatarLayer {
  return {
    id: config.id,
    opacity: config.opacity,
    shapes: [
      {
        kind: "path",
        d: `${waveLinePath(ctx, config.baseY, config.amplitude, config.waves, config.phase)} L${ctx.size},${ctx.size} L0,${ctx.size} Z`,
        fill: config.fill,
      },
    ],
  };
}

function waveLinePath(
  ctx: AvatarContext,
  baseY: number,
  amplitude: number,
  waves: number,
  phase: number,
): string {
  const segmentWidth = ctx.size / waves;
  const commands = [`M0,${format(baseY)}`];

  for (let index = 0; index < waves; index += 1) {
    const startX = index * segmentWidth;
    const endX = (index + 1) * segmentWidth;
    const direction = (index + phase) % 2 === 0 ? -1 : 1;
    const height = amplitude * ctx.rng.float(0.72, 1.18);
    const midY = clamp(baseY + direction * height, 56, ctx.size - 34);
    const controlX1 = startX + segmentWidth * ctx.rng.float(0.22, 0.34);
    const controlX2 = endX - segmentWidth * ctx.rng.float(0.22, 0.34);

    commands.push(
      `C${format(controlX1)},${format(midY)} ${format(controlX2)},${format(midY)} ${format(endX)},${format(baseY)}`,
    );
  }

  return commands.join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function format(value: number): string {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
