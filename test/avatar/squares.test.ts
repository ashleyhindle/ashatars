import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateSquares, SQUARES_TYPE } from "../../src/avatar/types/squares";

describe("squares avatar generator", () => {
  test("returns deterministic structured rect and path layers", () => {
    const input = {
      seed: "ashley@fuel.build",
      type: SQUARES_TYPE,
      vibe: "daybreak",
    };
    const first = generateSquares(createAvatarContext(input));
    const second = generateSquares(createAvatarContext(input));

    expect(first).toEqual(second);
    expect(first.layers).toHaveLength(2);
    expect(first.layers[0]?.id).toBe("squares-fill");
    expect(first.layers[1]?.id).toBe("squares-outline");
    expect(first.layers[0]?.shapes.length).toBeGreaterThanOrEqual(4);
    expect(first.layers[0]?.shapes.length).toBeLessThanOrEqual(9);
    expect(first.layers[1]?.shapes.length).toBe(first.layers[0]?.shapes.length);
    expect(first.layers[0]?.shapes.every((shape) => shape.kind === "rect")).toBe(true);
    expect(first.layers[1]?.shapes.every((shape) => shape.kind === "path")).toBe(true);
  });

  test("renders valid non-empty 512 viewBox SVG geometry", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: SQUARES_TYPE,
      vibe: "ocean",
    });
    const artwork = generateSquares(ctx);
    const svg = renderAvatarSvg(ctx, VIBES.ocean, artwork);

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("<path");
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke-width="');
    expect(hashHex(["snapshot", svg])).toBe("3a0ffa2bf42a7c89c854a82e36366cdd");
  });

  test("keeps vibe colors out of the generator output and varies by seed and vibe", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: SQUARES_TYPE,
      vibe: "daybreak",
    });
    const secondCtx = createAvatarContext({
      seed: "Fuel Squares Team",
      type: SQUARES_TYPE,
      vibe: "stealth",
    });
    const firstArtwork = generateSquares(firstCtx);
    const secondArtwork = generateSquares(secondCtx);
    const firstSvg = renderAvatarSvg(firstCtx, VIBES.daybreak, firstArtwork);
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.stealth, secondArtwork);
    const structured = JSON.stringify([firstArtwork, secondArtwork]);
    const vibeColors = Object.values(VIBES).flatMap((vibe) => [
      vibe.background.from,
      vibe.background.to,
      ...Object.values(vibe.palette),
    ]);

    for (const color of vibeColors) {
      expect(structured).not.toContain(color);
    }

    expect(firstSvg).not.toBe(secondSvg);
    expect(firstSvg).toContain(VIBES.daybreak.palette.primary);
    expect(secondSvg).toContain(VIBES.stealth.palette.primary);
  });
});
