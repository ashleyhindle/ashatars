import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateWiggles, WIGGLES_TYPE } from "../../src/avatar/types/wiggles";

describe("wiggles avatar generator", () => {
  test("returns deterministic structured curved path layers", () => {
    const first = generateWiggles(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: WIGGLES_TYPE,
        vibe: "daybreak",
      }),
    );
    const second = generateWiggles(
      createAvatarContext({
        seed: "  ASHLEY@FUEL.BUILD ",
        type: WIGGLES_TYPE,
        vibe: "daybreak",
      }),
    );
    const roles = new Set<string>();

    expect(first).toEqual(second);
    expect(first.layers.map((layer) => layer.id)).toEqual([
      "wiggles-soft",
      "wiggles-lines",
      "wiggles-sparks",
    ]);

    for (const layer of first.layers) {
      expect(layer.shapes.length).toBeGreaterThan(0);
      for (const shape of layer.shapes) {
        expect(shape.kind).toBe("path");
        if (shape.kind !== "path") {
          continue;
        }

        expect(shape.d).toStartWith("M");
        expect(/[CQ]/.test(shape.d)).toBe(true);
        expect(shape.fill).toBe("none");
        expect(shape.stroke).toBeDefined();
        if (shape.stroke && shape.stroke !== "none") {
          roles.add(shape.stroke.role);
        }
        expect(JSON.stringify(shape)).not.toContain("#");
        expect(pathNumbers(shape.d).every((value) => value >= 0 && value <= 512)).toBe(true);
      }
    }

    expect(roles.has("primary")).toBe(true);
    expect(roles.has("secondary")).toBe(true);
    expect(roles.has("accent")).toBe(true);
    expect(roles.has("soft")).toBe(true);
  });

  test("renders valid non-empty 512 viewBox SVG across seeds and vibes", () => {
    const samples = [
      { seed: "ashley@fuel.build", vibe: "ocean" },
      { seed: "7db79f08-6b58-434d-a58d-3309b9eb0975", vibe: "sunset" },
    ] as const;
    const hashes = new Set<string>();

    for (const sample of samples) {
      const ctx = createAvatarContext({
        seed: sample.seed,
        type: WIGGLES_TYPE,
        vibe: sample.vibe,
      });
      const artwork = generateWiggles(ctx);
      const svg = renderAvatarSvg(ctx, VIBES[sample.vibe], artwork);

      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain('<g id="wiggles-lines">');
      expect(svg).toContain("<path");
      expect(svg).toContain('fill="none"');
      expect(svg).toContain(VIBES[sample.vibe].palette.primary);
      expect(svg).not.toContain("Math.random");
      hashes.add(hashHex(["wiggles", svg]));
    }

    expect(hashes.size).toBe(samples.length);
  });
});

function pathNumbers(path: string): number[] {
  return [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}
