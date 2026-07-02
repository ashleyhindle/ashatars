import type { AvatarContext, DeterministicRng } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import type { PaletteRole } from "../vibes";

export const CLOCK_TYPE = "clock";
export const CLOCK_MIN_ANGLE_RADIANS = (20 * Math.PI) / 180;

const TWO_PI = Math.PI * 2;
const CENTER = 256;
const OUTER_RADIUS = 218;
const TICK_RADIUS = 230;
const ROLES = ["primary", "secondary", "accent", "contrast"] as const satisfies readonly PaletteRole[];

export function generateClock(ctx: AvatarContext): AvatarArtwork {
  const handCount = ctx.rng.int(9, 14);
  const angles = generateSpacedClockAngles({
    count: handCount,
    minRadians: CLOCK_MIN_ANGLE_RADIANS,
    rng: ctx.rng,
  });
  const hands: AvatarShape[] = angles.map((angle, index) => {
    const length = ctx.rng.float(96, OUTER_RADIUS);
    const width = ctx.rng.float(4.5, index % 3 === 0 ? 13 : 9);
    const role = ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]!;
    const end = polarPoint(angle, length);

    return {
      kind: "path",
      d: `M${CENTER},${CENTER} L${end.x},${end.y}`,
      fill: "none",
      stroke: { role },
      strokeWidth: width,
      opacity: ctx.rng.float(0.68, 0.96),
    };
  });

  return {
    layers: [
      {
        id: "clock-ticks",
        opacity: 0.72,
        shapes: generateTicks(ctx.rng),
      },
      {
        id: "clock-hands",
        shapes: hands,
      },
      {
        id: "clock-hub",
        shapes: [
          {
            kind: "circle",
            cx: CENTER,
            cy: CENTER,
            r: ctx.rng.float(23, 34),
            fill: { role: "soft" },
            stroke: { role: "contrast" },
            strokeWidth: ctx.rng.float(3, 5.5),
            opacity: 0.9,
          },
          {
            kind: "circle",
            cx: CENTER,
            cy: CENTER,
            r: ctx.rng.float(9, 14),
            fill: { role: "accent" },
            opacity: 0.95,
          },
        ],
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

function generateTicks(rng: DeterministicRng): AvatarShape[] {
  const ticks: AvatarShape[] = [];

  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * TWO_PI;
    const major = index % 6 === 0;
    const inner = polarPoint(angle, major ? TICK_RADIUS - 27 : TICK_RADIUS - 17);
    const outer = polarPoint(angle, TICK_RADIUS);

    ticks.push({
      kind: "path",
      d: `M${inner.x},${inner.y} L${outer.x},${outer.y}`,
      fill: "none",
      stroke: { role: major ? "contrast" : "soft" },
      strokeWidth: major ? rng.float(5.5, 8) : rng.float(2.5, 4.25),
      opacity: major ? 0.78 : 0.5,
    });
  }

  return ticks;
}

function polarPoint(angle: number, radius: number): { x: number; y: number } {
  return {
    x: round(CENTER + Math.cos(angle) * radius),
    y: round(CENTER + Math.sin(angle) * radius),
  };
}

function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
