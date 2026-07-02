import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateZigzagVertical } from "../../src/avatar/types/zigzag_vertical";

describe("zigzag_vertical avatar generator", () => {
  test("returns structured stroked path layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "zigzag_vertical",
      vibe: "daybreak",
    });
    const artwork = generateZigzagVertical(ctx);
    const shapes = artwork.layers.flatMap((layer) => layer.shapes);

    expect(artwork.layers.map((layer) => layer.id)).toEqual([
      "zigzag_vertical_echo",
      "zigzag_vertical_main",
      "zigzag_vertical_highlight",
    ]);
    expect(shapes.length).toBe(5);
    expect(shapes.every((shape) => shape.kind === "path")).toBe(true);
    expect(shapes.every((shape) => shape.fill === "none")).toBe(true);
    expect(shapes.every((shape) => shape.stroke && shape.stroke !== "none")).toBe(true);
    expect(shapes.every((shape) => shape.strokeWidth && shape.strokeWidth > 0)).toBe(true);
  });

  test("builds non-empty 512 viewBox geometry that reads as a vertical zigzag", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "zigzag_vertical",
      vibe: "ocean",
    });
    const artwork = generateZigzagVertical(ctx);
    const main = artwork.layers
      .find((layer) => layer.id === "zigzag_vertical_main")
      ?.shapes.find((shape) => shape.kind === "path");

    expect(main).toBeDefined();
    if (!main || main.kind !== "path") {
      return;
    }

    const points = extractPoints(main.d);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);

    expect(points.length).toBeGreaterThanOrEqual(7);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(160);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(440);
    expect(points.every(([x, y]) => x >= 0 && x <= 512 && y >= 0 && y <= 512)).toBe(true);

    const svg = renderAvatarSvg(ctx, VIBES.ocean, artwork);
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain("<path");
  });

  test("is deterministic and keeps vibe colors out of generated structure", () => {
    const input = {
      seed: "  ASHLEY@FUEL.BUILD ",
      type: "zigzag_vertical",
      vibe: "forest",
    };
    const firstCtx = createAvatarContext(input);
    const secondCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "zigzag_vertical",
      vibe: "forest",
    });
    const firstArtwork = generateZigzagVertical(firstCtx);
    const secondArtwork = generateZigzagVertical(secondCtx);
    const firstSvg = renderAvatarSvg(firstCtx, VIBES.forest, firstArtwork);
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.forest, secondArtwork);

    expect(firstArtwork).toEqual(secondArtwork);
    expect(firstSvg).toBe(secondSvg);
    expect(hashHex(["zigzag_vertical", firstSvg])).toBe(
      "91a268805145b23631d94cc783b71762",
    );
    expect(JSON.stringify(firstArtwork)).not.toContain(VIBES.forest.palette.primary);
    expect(firstSvg).toContain(VIBES.forest.palette.primary);
  });

  test("varies across seeds and vibes", () => {
    const daybreak = renderAvatarSvg(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: "zigzag_vertical",
        vibe: "daybreak",
      }),
      VIBES.daybreak,
      generateZigzagVertical(
        createAvatarContext({
          seed: "ashley@fuel.build",
          type: "zigzag_vertical",
          vibe: "daybreak",
        }),
      ),
    );
    const stealth = renderAvatarSvg(
      createAvatarContext({
        seed: "zigzag@example.com",
        type: "zigzag_vertical",
        vibe: "stealth",
      }),
      VIBES.stealth,
      generateZigzagVertical(
        createAvatarContext({
          seed: "zigzag@example.com",
          type: "zigzag_vertical",
          vibe: "stealth",
        }),
      ),
    );

    expect(daybreak).not.toBe(stealth);
  });
});

function extractPoints(path: string): Array<readonly [number, number]> {
  const values = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const points: Array<readonly [number, number]> = [];

  for (let index = 0; index < values.length; index += 2) {
    points.push([values[index]!, values[index + 1]!]);
  }

  return points;
}
