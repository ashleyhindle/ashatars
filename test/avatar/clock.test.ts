import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  createRng,
  hashHex,
  renderAvatarSvg,
  VIBES,
} from "../../src/avatar";
import {
  CLOCK_MIN_ANGLE_RADIANS,
  circularAngleDistance,
  generateClock,
  generateSpacedClockAngles,
} from "../../src/avatar/types/clock";
import type { PathShape } from "../../src/avatar/render";

describe("clock avatar generator", () => {
  test("returns deterministic structured radial line layers", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "clock",
      vibe: "daybreak",
    });
    const secondCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "clock",
      vibe: "daybreak",
    });
    const first = generateClock(firstCtx);
    const second = generateClock(secondCtx);

    expect(first).toEqual(second);
    expect(first.layers.map((layer) => layer.id)).toEqual([
      "clock-ticks",
      "clock-hands",
      "clock-hub",
    ]);

    const handLayer = first.layers.find((layer) => layer.id === "clock-hands");
    expect(handLayer?.shapes.length).toBeGreaterThanOrEqual(9);
    expect(handLayer?.shapes.length).toBeLessThanOrEqual(14);
    expect(
      handLayer?.shapes.every(
        (shape) => shape.kind === "path" && shape.fill === "none" && Boolean(shape.stroke),
      ),
    ).toBe(true);
  });

  test("keeps generated hand angles at least 20 degrees apart", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "clock",
      vibe: "ocean",
    });
    const artwork = generateClock(ctx);
    const angles = handAngles(artwork.layers.find((layer) => layer.id === "clock-hands")?.shapes ?? []);

    for (let first = 0; first < angles.length; first += 1) {
      for (let second = first + 1; second < angles.length; second += 1) {
        expect(circularAngleDistance(angles[first]!, angles[second]!)).toBeGreaterThanOrEqual(
          CLOCK_MIN_ANGLE_RADIANS - 0.001,
        );
      }
    }
  });

  test("bounds angle spacing attempts for impossible dense requests", () => {
    const angles = generateSpacedClockAngles({
      count: 40,
      minRadians: CLOCK_MIN_ANGLE_RADIANS,
      rng: createRng(["clock", "edge"]),
      attemptsPerAngle: 3,
    });

    expect(angles).toHaveLength(40);
    expect(angles.every((angle) => Number.isFinite(angle) && angle >= 0 && angle < Math.PI * 2)).toBe(
      true,
    );
    expect(new Set(angles.map((angle) => angle.toFixed(12))).size).toBeGreaterThan(30);
  });

  test("renders non-empty 512 viewBox SVGs across seeds and vibes without vibe colors in artwork", () => {
    const cases = [
      { seed: "ashley@fuel.build", vibe: "daybreak" as const },
      { seed: "7db79f08-6b58-434d-a58d-3309b9eb0975", vibe: "ocean" as const },
    ];
    const svgs = cases.map(({ seed, vibe }) => {
      const ctx = createAvatarContext({ seed, type: "clock", vibe });
      const artwork = generateClock(ctx);
      const structured = JSON.stringify(artwork);
      const svg = renderAvatarSvg(ctx, VIBES[vibe], artwork);

      expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain('id="clock-hands"');
      expect(svg).toContain('stroke="');
      expect(svg.length).toBeGreaterThan(2400);
      for (const color of Object.values(VIBES[vibe].palette)) {
        expect(structured).not.toContain(color);
      }

      return svg;
    });

    expect(svgs[0]).not.toBe(svgs[1]);
    expect(hashHex(["clock-preview", svgs[0]!, svgs[1]!])).toMatch(/^[0-9a-f]{32}$/);
  });
});

function handAngles(shapes: readonly unknown[]): number[] {
  return shapes.map((shape) => {
    const path = shape as PathShape;
    const match = /^M256,256 L(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(path.d);
    expect(match).not.toBeNull();
    const x = Number(match![1]);
    const y = Number(match![2]);
    return Math.atan2(y - 256, x - 256);
  });
}
