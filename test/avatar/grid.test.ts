import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex } from "../../src/avatar/core";
import { renderAvatarSvg } from "../../src/avatar/render";
import { generateGrid } from "../../src/avatar/types/grid";
import { VIBES } from "../../src/avatar/vibes";

describe("grid avatar generator", () => {
  test("returns structured horizontal and vertical line layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "grid",
      vibe: "daybreak",
    });
    const artwork = generateGrid(ctx);

    expect(artwork.layers.map((layer) => layer.id)).toEqual([
      "grid-horizontal",
      "grid-vertical",
    ]);

    for (const layer of artwork.layers) {
      expect(layer.shapes.length).toBeGreaterThanOrEqual(4);
      expect(layer.shapes.length).toBeLessThanOrEqual(7);
      expect(layer.shapes.every((shape) => shape.kind === "path")).toBe(true);
      expect(layer.shapes.every((shape) => shape.fill === "none")).toBe(true);
      expect(
        layer.shapes.every((shape) => typeof shape.stroke === "object" && "role" in shape.stroke),
      ).toBe(true);
    }
  });

  test("is deterministic for the same seed, type, and vibe", () => {
    const first = renderGrid("ashley@fuel.build", "daybreak");
    const second = renderGrid("ashley@fuel.build", "daybreak");

    expect(first).toBe(second);
    expect(hashHex(["grid-snapshot", first])).toBe("8a1d004a618458086d6f382074edce83");
  });

  test("renders valid non-empty 512 viewBox geometry without vibe colors in the generator", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "grid",
      vibe: "ocean",
    });
    const artwork = generateGrid(ctx);
    const svg = renderAvatarSvg(ctx, VIBES.ocean, artwork);

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain("<path");
    expect(svg).toContain('fill="none"');
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.background.from);
  });

  test("places irregular horizontal and vertical lines inside the 512 canvas", () => {
    const ctx = createAvatarContext({
      seed: "team-grid",
      type: "grid",
      vibe: "forest",
    });
    const artwork = generateGrid(ctx);
    const horizontal = artwork.layers[0]!.shapes.map((shape) => coordinates(pathData(shape))[1]!);
    const vertical = artwork.layers[1]!.shapes.map((shape) => coordinates(pathData(shape))[0]!);

    expect(horizontal.every((value) => value >= 0 && value <= 512)).toBe(true);
    expect(vertical.every((value) => value >= 0 && value <= 512)).toBe(true);
    expect(new Set(horizontal.map(Math.round)).size).toBe(horizontal.length);
    expect(new Set(vertical.map(Math.round)).size).toBe(vertical.length);
    expect(hasIrregularGaps(horizontal)).toBe(true);
    expect(hasIrregularGaps(vertical)).toBe(true);
  });

  test("varies across seeds and vibes", () => {
    const daybreak = renderGrid("ashley@fuel.build", "daybreak");
    const ocean = renderGrid("ashley@fuel.build", "ocean");
    const forest = renderGrid("grid-review", "forest");

    expect(daybreak).not.toBe(ocean);
    expect(daybreak).not.toBe(forest);
    expect(ocean).not.toBe(forest);
  });
});

function renderGrid(seed: string, vibe: keyof typeof VIBES): string {
  const ctx = createAvatarContext({ seed, type: "grid", vibe });
  return renderAvatarSvg(ctx, VIBES[vibe], generateGrid(ctx));
}

function coordinates(d: unknown): number[] {
  if (typeof d !== "string") {
    throw new Error("Expected path data.");
  }

  return d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
}

function pathData(shape: { readonly kind: string }): string {
  if (shape.kind !== "path" || !("d" in shape) || typeof shape.d !== "string") {
    throw new Error("Expected a path shape.");
  }

  return shape.d;
}

function hasIrregularGaps(values: number[]): boolean {
  const gaps = values.slice(1).map((value, index) => Math.round(value - values[index]!));
  return new Set(gaps).size > 1;
}
