import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateDiagonalGrid } from "../../src/avatar/types/diagonal-grid";
import type { PathShape } from "../../src/avatar/render";

describe("diagonal grid avatar generator", () => {
  test("returns deterministic structured line layers", () => {
    const first = generateDiagonalGrid(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: "diagonal_grid",
        vibe: "ocean",
      }),
    );
    const second = generateDiagonalGrid(
      createAvatarContext({
        seed: "  ASHLEY@FUEL.BUILD ",
        type: "diagonal_grid",
        vibe: "ocean",
      }),
    );

    expect(second).toEqual(first);
    expect(hashHex(["diagonal-grid", JSON.stringify(first)])).toBe(
      "c0778cfa1600f703c264b176469ba744",
    );
  });

  test("emits non-empty semantic stroke paths with no vibe colors", () => {
    const artwork = generateDiagonalGrid(
      createAvatarContext({
        seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
        type: "diagonal_grid",
        vibe: "fire",
      }),
    );
    const shapes = artwork.layers.flatMap((layer) => layer.shapes);
    const serialized = JSON.stringify(artwork);

    expect(artwork.layers.map((layer) => layer.id)).toEqual([
      "diagonal_grid-soft",
      "diagonal_grid-lines",
    ]);
    expect(shapes.length).toBeGreaterThanOrEqual(8);
    expect(shapes.length).toBeLessThanOrEqual(24);
    expect(shapes.every((shape) => shape.kind === "path")).toBe(true);
    expect(
      shapes.every(
        (shape) =>
          shape.fill === "none" &&
          typeof shape.stroke === "object" &&
          shape.stroke != null &&
          "role" in shape.stroke,
      ),
    ).toBe(true);
    expect(serialized).not.toContain(VIBES.fire.palette.primary);
    expect(serialized).not.toContain(VIBES.fire.palette.secondary);
  });

  test("renders as crossing diagonal grid geometry in a 512 viewBox", () => {
    const ctx = createAvatarContext({
      seed: "Mixed Case Team",
      type: "diagonal_grid",
      vibe: "crystal",
    });
    const artwork = generateDiagonalGrid(ctx);
    const lineShapes = artwork.layers[1]?.shapes as PathShape[];
    const slopes = lineShapes.map((shape) => slopeFromPath(shape.d));
    const svg = renderAvatarSvg(ctx, VIBES.crystal, artwork);

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(VIBES.crystal.palette.accent);
    expect(svg.length).toBeGreaterThan(1200);
    expect(slopes.some((slope) => slope > 0.25)).toBe(true);
    expect(slopes.some((slope) => slope < -0.25)).toBe(true);
    expect(slopes.every((slope) => Number.isFinite(slope) && Math.abs(slope) > 0.25)).toBe(true);
  });
});

function slopeFromPath(path: string): number {
  const match = /^M(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?) L(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(
    path,
  );
  if (!match) {
    throw new Error(`Unexpected path: ${path}`);
  }

  const [, x1, y1, x2, y2] = match.map(Number);
  return (y2! - y1!) / (x2! - x1!);
}
