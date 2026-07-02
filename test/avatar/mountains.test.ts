import { describe, expect, test } from "bun:test";
import { createAvatarContext, renderAvatarSvg, VIBES } from "../../src/avatar";
import { MOUNTAINS_TYPE, generateMountains } from "../../src/avatar/types/mountains";

describe("mountains avatar generator", () => {
  test("returns deterministic structured ridge layers", () => {
    const input = {
      seed: "ridge@example.test",
      type: MOUNTAINS_TYPE,
      vibe: "forest",
    };
    const first = generateMountains(createAvatarContext(input));
    const second = generateMountains(createAvatarContext(input));

    expect(first).toEqual(second);
    expect(first.layers.length).toBeGreaterThanOrEqual(3);
    expect(first.layers[0]?.id).toBe("mountain-band-1");
    expect(first.layers.flatMap((layer) => layer.shapes).every((shape) => shape.kind === "path")).toBe(true);
  });

  test("keeps mountain geometry non-empty inside the 512 viewBox", () => {
    const artwork = generateMountains(
      createAvatarContext({
        seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
        type: MOUNTAINS_TYPE,
        vibe: "ocean",
      }),
    );
    const paths = artwork.layers.flatMap((layer) => layer.shapes).map((shape) => {
      expect(shape.kind).toBe("path");
      return shape.kind === "path" ? shape.d : "";
    });
    const numbers = paths.flatMap((path) => path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []);

    expect(paths.length).toBeGreaterThanOrEqual(3);
    expect(paths[0]).toStartWith("M0,");
    expect(paths[0]).toContain("L512,512 L0,512 Z");
    expect(numbers.every((value) => Number.isFinite(value))).toBe(true);
    expect(numbers.every((value) => value >= 0 && value <= 512)).toBe(true);
  });

  test("renders valid SVG across multiple seeds and vibes without generator-owned colors", () => {
    const cases = [
      { seed: "ashley@fuel.build", vibe: "daybreak" },
      { seed: "mountain-lake", vibe: "stealth" },
    ] as const;

    for (const item of cases) {
      const ctx = createAvatarContext({
        seed: item.seed,
        type: MOUNTAINS_TYPE,
        vibe: item.vibe,
      });
      const vibe = VIBES[item.vibe];
      const artwork = generateMountains(ctx);
      const svg = renderAvatarSvg(ctx, vibe, artwork);

      expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain("mountain-band-");
      expect(svg).toContain(vibe.palette.primary);
      expect(JSON.stringify(artwork)).not.toContain("#");
    }
  });
});
