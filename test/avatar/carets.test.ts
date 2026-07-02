import { describe, expect, test } from "bun:test";
import { createAvatarContext, renderAvatarSvg, VIBES } from "../../src/avatar";
import { CARETS_TYPE, generateCarets } from "../../src/avatar/types/carets";

describe("carets avatar generator", () => {
  test("returns deterministic structured caret path layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: CARETS_TYPE,
      vibe: "daybreak",
    });
    const first = generateCarets(ctx);
    const second = generateCarets(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: CARETS_TYPE,
        vibe: "daybreak",
      }),
    );

    expect(first).toEqual(second);
    expect(first.layers.map((layer) => layer.id)).toEqual(["carets-shadow", "carets-marks"]);
    expect(first.layers[0]?.shapes.length).toBe(first.layers[1]?.shapes.length);
    expect(first.layers[1]?.shapes.length).toBeGreaterThanOrEqual(18);
  });

  test("emits only non-empty caret paths with semantic paint roles", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: CARETS_TYPE,
      vibe: "ocean",
    });
    const artwork = generateCarets(ctx);
    const shapes = artwork.layers.flatMap((layer) => layer.shapes);

    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.every((shape) => shape.kind === "path")).toBe(true);

    for (const shape of shapes) {
      expect(shape.kind).toBe("path");
      if (shape.kind !== "path") {
        continue;
      }

      expect(shape.d).toMatch(/^M[\d.,\-\s]+ L[\d.,\-\s]+ L[\d.,\-\s]+$/);
      expect(shape.fill).toBe("none");
      expect(shape.stroke).toEqual(expect.objectContaining({ role: expect.any(String) }));
      expect(["primary", "secondary", "accent", "soft", "contrast"]).toContain(
        shape.stroke && shape.stroke !== "none" ? shape.stroke.role : "",
      );
      expect(shape.strokeWidth).toBeGreaterThan(0);
    }

    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.secondary);
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.accent);
  });

  test("renders valid 512 viewBox SVGs that vary across seeds and vibes", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: CARETS_TYPE,
      vibe: "daybreak",
    });
    const secondCtx = createAvatarContext({
      seed: "carets-preview-seed",
      type: CARETS_TYPE,
      vibe: "stealth",
    });
    const first = renderAvatarSvg(firstCtx, VIBES.daybreak, generateCarets(firstCtx));
    const second = renderAvatarSvg(secondCtx, VIBES.stealth, generateCarets(secondCtx));

    expect(first).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(first).toContain('viewBox="0 0 512 512"');
    expect(first).toContain('<g id="carets-marks">');
    expect(first).toContain("<path ");
    expect(second).toContain('viewBox="0 0 512 512"');
    expect(second).toContain(VIBES.stealth.palette.primary);
    expect(first).not.toBe(second);
  });
});
