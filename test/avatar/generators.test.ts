import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  createRng,
  renderAvatarSvg,
  SUPPORTED_AVATAR_TYPES,
  VIBES,
} from "../../src/avatar";
import { getAvatarGenerator } from "../../src/avatar/types";
import {
  CLOCK_MIN_ANGLE_RADIANS,
  circularAngleDistance,
  generateSpacedClockAngles,
} from "../../src/avatar/types/clock";
import type { AvatarArtwork, AvatarShape, PathShape } from "../../src/avatar/render";

const EXPECTED_LAYER_IDS: Record<string, readonly string[]> = {
  circles: ["circles"],
  lines: ["lines"],
  grid: ["grid"],
  diagonal_grid: ["diagonal_grid"],
  squares: ["squares"],
  mountains: ["mountains"],
  zigzag_vertical: ["zigzag_vertical"],
  wiggles: ["wiggles"],
  sunrise: ["sunrise"],
  clock: ["clock-hands"],
  dots: ["dots"],
  concentric_arcs: ["concentric_arcs"],
  iris: ["iris"],
  wave: ["wave"],
  blob_face: ["blob-face-hair", "blob-face-features"],
  carets: ["carets"],
};

const EXPECTED_SHAPES: Record<string, readonly AvatarShape["kind"][]> = {
  circles: ["circle"],
  lines: ["path"],
  grid: ["path"],
  diagonal_grid: ["path"],
  squares: ["path"],
  mountains: ["path"],
  zigzag_vertical: ["path"],
  wiggles: ["path"],
  sunrise: ["path"],
  clock: ["path"],
  dots: ["circle"],
  concentric_arcs: ["path"],
  iris: ["path", "circle"],
  wave: ["path"],
  blob_face: ["path"],
  carets: ["path"],
};

describe("ref-inspired avatar generators", () => {
  test("every supported type returns deterministic simple structured geometry", () => {
    for (const type of SUPPORTED_AVATAR_TYPES) {
      const generator = getAvatarGenerator(type);
      expect(generator).toBeDefined();
      if (!generator) {
        continue;
      }

      const input = { seed: "ashley@fuel.build", type, vibe: "daybreak" };
      const first = generator.generate(createAvatarContext(input));
      const second = generator.generate(createAvatarContext(input));

      expect(first).toEqual(second);
      expect(first.layers.map((layer) => layer.id)).toEqual([...(EXPECTED_LAYER_IDS[type] ?? [])]);
      expect(first.layers.length).toBeLessThanOrEqual(2);
      expect(shapeCount(first)).toBeGreaterThan(0);
      expect(shapeCount(first)).toBeLessThanOrEqual(type === "dots" ? 24 : 16);
      expect(shapeKinds(first)).toEqual(new Set(EXPECTED_SHAPES[type] ?? []));
      expect(pathNumbers(first).every((value) => value >= -512 && value <= 512)).toBe(true);
      expect(JSON.stringify(first)).not.toContain("#");
    }
  });

  test("representative ref motifs use the expected simple geometry", () => {
    expect(pathsFor("lines").every((path) => /^M.+ L.+ Z$/.test(path.d))).toBe(true);
    expect(pathsFor("grid").every((path) => /^M/.test(path.d) && path.d.includes(" L"))).toBe(true);
    expect(pathsFor("diagonal_grid").every((path) => path.d.includes(" L"))).toBe(true);
    expect(pathsFor("squares").every((path) => path.d.includes(" h") && path.d.includes(" v"))).toBe(true);
    expect(pathsFor("sunrise").every((path) => /^M0,\d+ H512$/.test(path.d))).toBe(true);
    expect(pathsFor("clock").every((path) => /^M256,256 L/.test(path.d))).toBe(true);
    expect(pathsFor("wiggles").every((path) => path.d.includes("S"))).toBe(true);
  });

  test("every supported type renders a valid non-empty 512 viewBox SVG", () => {
    for (const type of SUPPORTED_AVATAR_TYPES) {
      const generator = getAvatarGenerator(type)!;
      const ctx = createAvatarContext({
        seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
        type,
        vibe: "ocean",
      });
      const svg = renderAvatarSvg(ctx, VIBES.ocean, generator.generate(ctx));

      expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain(VIBES.ocean.background.from);
      expect(svg).toContain(VIBES.ocean.foreground);
      expect(svg).not.toContain("Math.random");
    }
  });

  test("clock angle helper keeps generated hands spaced", () => {
    const angles = generateSpacedClockAngles({
      count: 3,
      minRadians: CLOCK_MIN_ANGLE_RADIANS,
      rng: createRng(["clock", "spacing"]),
    });

    for (let first = 0; first < angles.length; first += 1) {
      for (let second = first + 1; second < angles.length; second += 1) {
        expect(circularAngleDistance(angles[first]!, angles[second]!)).toBeGreaterThanOrEqual(
          CLOCK_MIN_ANGLE_RADIANS - 0.001,
        );
      }
    }
  });
});

function pathsFor(type: string): PathShape[] {
  const generator = getAvatarGenerator(type);
  expect(generator).toBeDefined();
  const artwork = generator!.generate(createAvatarContext({ seed: "ref-preview", type, vibe: "daybreak" }));
  return artwork.layers.flatMap((layer) => layer.shapes).filter((shape): shape is PathShape => shape.kind === "path");
}

function shapeCount(artwork: AvatarArtwork): number {
  return artwork.layers.reduce((count, layer) => count + layer.shapes.length, 0);
}

function shapeKinds(artwork: AvatarArtwork): Set<AvatarShape["kind"]> {
  return new Set(artwork.layers.flatMap((layer) => layer.shapes).map((shape) => shape.kind));
}

function pathNumbers(artwork: AvatarArtwork): number[] {
  return artwork.layers
    .flatMap((layer) => layer.shapes)
    .flatMap((shape) => (shape.kind === "path" ? shape.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [] : []));
}
