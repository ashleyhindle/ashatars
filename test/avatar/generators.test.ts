import { describe, expect, test } from "bun:test";
import {
  ALL_AVATAR_TYPES,
  createAvatarContext,
  createRng,
  renderAvatarSvg,
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
  test("every implemented type returns deterministic simple structured geometry", () => {
    for (const type of ALL_AVATAR_TYPES) {
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
    expect(pathsFor("lines").every((path) => /^M.+ L.+$/.test(path.d))).toBe(true);
    expect(pathsFor("grid").every((path) => /^M/.test(path.d) && path.d.includes(" L"))).toBe(true);
    expect(pathsFor("diagonal_grid").every((path) => path.d.includes(" L"))).toBe(true);
    expect(pathsFor("squares").every((path) => path.d.includes(" h") && path.d.includes(" v"))).toBe(true);
    expect(pathsFor("sunrise").every((path) => /^M0,\d+ H512$/.test(path.d))).toBe(true);
    expect(pathsFor("clock").every((path) => /^M256,256 L/.test(path.d))).toBe(true);
    expect(pathsFor("wiggles").every((path) => path.d.includes("S"))).toBe(true);
  });

  test("lines generator keeps one layer but varies deterministic segment thickness", () => {
    for (const seed of ["ashley@fuel.build", "7db79f08-6b58-434d-a58d-3309b9eb0975"]) {
      const input = { seed, type: "lines", vibe: "stealth" };
      const first = getAvatarGenerator("lines")!.generate(createAvatarContext(input));
      const second = getAvatarGenerator("lines")!.generate(createAvatarContext(input));
      const linePaths = first.layers
        .flatMap((layer) => layer.shapes)
        .filter((shape): shape is PathShape => shape.kind === "path");
      const strokeWidths = linePaths.map((path) => path.strokeWidth ?? 0);

      expect(first).toEqual(second);
      expect(first.layers.map((layer) => layer.id)).toEqual(["lines"]);
      expect(linePaths.length).toBeGreaterThanOrEqual(3);
      expect(
        linePaths.every(
          (path) => path.fill === "none" && path.stroke !== "none" && path.stroke?.role === "primary",
        ),
      ).toBe(true);
      expect(new Set(strokeWidths).size).toBeGreaterThanOrEqual(3);
      expect(Math.min(...strokeWidths)).toBeLessThanOrEqual(9);
      expect(Math.max(...strokeWidths)).toBeGreaterThanOrEqual(19);
      expect(Math.max(...strokeWidths) - Math.min(...strokeWidths)).toBeGreaterThanOrEqual(10);
    }
  });

  test("sunrise generator keeps one path layer with visible deterministic stroke-width spread", () => {
    for (const seed of ["ashley@fuel.build", "7db79f08-6b58-434d-a58d-3309b9eb0975"]) {
      const input = { seed, type: "sunrise", vibe: "stealth" };
      const first = getAvatarGenerator("sunrise")!.generate(createAvatarContext(input));
      const second = getAvatarGenerator("sunrise")!.generate(createAvatarContext(input));
      const sunrisePaths = first.layers
        .flatMap((layer) => layer.shapes)
        .filter((shape): shape is PathShape => shape.kind === "path");
      const strokeWidths = sunrisePaths.map((path) => path.strokeWidth ?? 0);

      expect(first).toEqual(second);
      expect(first.layers.map((layer) => layer.id)).toEqual(["sunrise"]);
      expect(sunrisePaths.length).toBeGreaterThanOrEqual(3);
      expect(
        sunrisePaths.every(
          (path) => path.fill === "none" && path.stroke !== "none" && path.stroke?.role === "primary",
        ),
      ).toBe(true);
      expect(new Set(strokeWidths).size).toBeGreaterThanOrEqual(3);
      expect(Math.min(...strokeWidths)).toBeLessThanOrEqual(9);
      expect(Math.max(...strokeWidths)).toBeGreaterThanOrEqual(24);
      expect(Math.max(...strokeWidths) - Math.min(...strokeWidths)).toBeGreaterThanOrEqual(15);
    }
  });

  test("squares generator uses multiple outlines with visible deterministic stroke-width spread", () => {
    for (const seed of ["ashley@fuel.build", "7db79f08-6b58-434d-a58d-3309b9eb0975"]) {
      const input = { seed, type: "squares", vibe: "stealth" };
      const first = getAvatarGenerator("squares")!.generate(createAvatarContext(input));
      const second = getAvatarGenerator("squares")!.generate(createAvatarContext(input));
      const squarePaths = first.layers
        .flatMap((layer) => layer.shapes)
        .filter((shape): shape is PathShape => shape.kind === "path");
      const strokeWidths = squarePaths.map((path) => path.strokeWidth ?? 0);

      expect(first).toEqual(second);
      expect(first.layers.map((layer) => layer.id)).toEqual(["squares"]);
      expect(squarePaths.length).toBeGreaterThanOrEqual(2);
      expect(
        squarePaths.every(
          (path) => path.fill === "none" && path.stroke !== "none" && path.stroke?.role === "primary",
        ),
      ).toBe(true);
      expect(new Set(strokeWidths).size).toBeGreaterThanOrEqual(2);
      expect(Math.min(...strokeWidths)).toBeLessThanOrEqual(9);
      expect(Math.max(...strokeWidths)).toBeGreaterThanOrEqual(22);
      expect(Math.max(...strokeWidths) - Math.min(...strokeWidths)).toBeGreaterThanOrEqual(13);
    }
  });

  test("every implemented type renders a valid non-empty 512 viewBox SVG", () => {
    for (const type of ALL_AVATAR_TYPES) {
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
