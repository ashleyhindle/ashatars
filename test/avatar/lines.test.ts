import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  hashHex,
  renderAvatarSvg,
  VIBES,
} from "../../src/avatar";
import { generateLines, LINES_TYPE } from "../../src/avatar/types/lines";

describe("lines avatar generator", () => {
  test("returns deterministic structured angular line artwork", () => {
    const input = {
      seed: "ashley@fuel.build",
      type: LINES_TYPE,
      vibe: "daybreak",
    };
    const first = generateLines(createAvatarContext(input));
    const second = generateLines(createAvatarContext(input));
    const shapes = first.layers[0]?.shapes ?? [];

    expect(first).toEqual(second);
    expect(hashHex(["lines", JSON.stringify(first)])).toBe(
      hashHex(["lines", JSON.stringify(second)]),
    );
    expect(first.layers).toHaveLength(1);
    expect(first.layers[0]?.id).toBe("lines");
    expect(shapes.length).toBeGreaterThanOrEqual(8);
    expect(shapes.every((shape) => shape.kind === "path")).toBe(true);
    expect(shapes.some((shape) => shape.fill === "none")).toBe(true);
    expect(shapes.some((shape) => shape.stroke)).toBe(true);
  });

  test("renders non-empty 512 viewBox SVG geometry across seeds and vibes", () => {
    const cases = [
      { seed: "ashley@fuel.build", vibe: "ocean" },
      { seed: "7db79f08-6b58-434d-a58d-3309b9eb0975", vibe: "sunset" },
    ] as const;
    const svgs: string[] = [];

    for (const preview of cases) {
      const ctx = createAvatarContext({
        seed: preview.seed,
        type: LINES_TYPE,
        vibe: preview.vibe,
      });
      const artwork = generateLines(ctx);
      const svg = renderAvatarSvg(ctx, VIBES[preview.vibe], artwork);
      const numbers = JSON.stringify(artwork).match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      svgs.push(svg);

      expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain("<path ");
      expect(svg).toContain('fill="none"');
      expect(numbers.length).toBeGreaterThan(20);
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(512);
    }

    expect(svgs[0]).not.toBe(svgs[1]);
  });

  test("keeps vibe colors outside generator output", () => {
    const ctx = createAvatarContext({
      seed: "lines-demo",
      type: LINES_TYPE,
      vibe: "crystal",
    });
    const artwork = generateLines(ctx);
    const structured = JSON.stringify(artwork);

    for (const color of Object.values(VIBES.crystal.palette)) {
      expect(structured).not.toContain(color);
    }

    expect(structured).not.toContain(VIBES.crystal.background.from);
    expect(structured).not.toContain(VIBES.crystal.background.to);
  });
});
