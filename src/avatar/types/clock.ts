import type { AvatarContext, DeterministicRng } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const CLOCK_TYPE = "clock";
export const CLOCK_MIN_ANGLE_RADIANS = (20 * Math.PI) / 180;

const TWO_PI = Math.PI * 2;
const CENTER = 256;
const HAND_COUNTS = [2, 3] as const;

export function generateClock(ctx: AvatarContext): AvatarArtwork {
  const handCount = ctx.rng.pick(HAND_COUNTS);
  const angles = generateSpacedClockAngles({
    count: handCount,
    minRadians: CLOCK_MIN_ANGLE_RADIANS,
    rng: ctx.rng,
  });
  const hands: AvatarShape[] = angles.map((angle) => {
    const length = ctx.rng.int(80, 280);
    const end = polarPoint(angle, length);

    return {
      kind: "path",
      d: `M${CENTER},${CENTER} L${end.x},${end.y}`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(9, 18),
    };
  });

  return {
    layers: [
      {
        id: "clock-hands",
        shapes: hands,
      },
    ],
  };
}

export function generateSpacedClockAngles(input: {
  readonly count: number;
  readonly minRadians: number;
  readonly rng: DeterministicRng;
  readonly attemptsPerAngle?: number;
}): number[] {
  if (!Number.isSafeInteger(input.count) || input.count < 0) {
    throw new Error("Clock angle count must be a non-negative safe integer.");
  }

  if (!Number.isFinite(input.minRadians) || input.minRadians < 0 || input.minRadians > Math.PI) {
    throw new Error("Clock minimum angle must be between 0 and pi radians.");
  }

  if (input.count === 0) {
    return [];
  }

  if (input.count * input.minRadians <= TWO_PI) {
    return guaranteedSpacedAngles(input.count, input.minRadians, input.rng);
  }

  return boundedDenseAngles(input.count, input.rng);
}

export function circularAngleDistance(first: number, second: number): number {
  const diff = Math.abs(normalizeAngle(first) - normalizeAngle(second));
  return Math.min(diff, TWO_PI - diff);
}

function guaranteedSpacedAngles(
  count: number,
  minRadians: number,
  rng: DeterministicRng,
): number[] {
  const slack = TWO_PI - count * minRadians;
  const weights = Array.from({ length: count }, () => rng.float(0.35, 1.35));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const gaps = weights.map((weight) => minRadians + (slack * weight) / totalWeight);
  const start = rng.next() * TWO_PI;
  const angles = [start];

  for (let index = 1; index < count; index += 1) {
    angles.push(normalizeAngle(angles[index - 1]! + gaps[index - 1]!));
  }

  return angles;
}

function boundedDenseAngles(count: number, rng: DeterministicRng): number[] {
  const step = TWO_PI / count;
  const start = rng.next() * TWO_PI;

  return Array.from({ length: count }, (_, index) =>
    normalizeAngle(start + index * step + rng.float(-step * 0.24, step * 0.24)),
  );
}

function polarPoint(angle: number, radius: number): { x: number; y: number } {
  return {
    x: Math.round((CENTER + Math.cos(angle) * radius) * 1000) / 1000,
    y: Math.round((CENTER + Math.sin(angle) * radius) * 1000) / 1000,
  };
}

function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}
