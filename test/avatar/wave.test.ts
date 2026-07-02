import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateWave, WAVE_TYPE } from "../../src/avatar/types/wave";

describe("wave avatar generator", () => {
  test("returns structured curved path layers with semantic paint roles", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: WAVE_TYPE,
      vibe: "ocean",
    });
    const artwork = generateWave(ctx);
    const roles = new Set<string>();

    expect(artwork.layers.length).toBeGreaterThanOrEqual(4);
    expect(artwork.layers.every((layer) => layer.id.startsWith("wave-"))).toBe(true);

    for (const layer of artwork.layers) {
      expect(layer.shapes.length).toBeGreaterThan(0);
      for (const shape of layer.shapes) {
        expect(shape.kind).toBe("path");
        if (shape.kind !== "path") {
          continue;
        }
        expect(shape.d).toContain("C");
        expect(shape.d).toStartWith("M0,");
        if (shape.fill && shape.fill !== "none") {
          roles.add(shape.fill.role);
        }
        if (shape.stroke && shape.stroke !== "none") {
          roles.add(shape.stroke.role);
        }
      }
    }

    expect(roles.has("primary")).toBe(true);
    expect(roles.has("secondary")).toBe(true);
    expect(roles.has("soft")).toBe(true);
    expect(roles.has("accent") || roles.has("contrast")).toBe(true);
    expect(JSON.stringify(artwork)).not.toContain("#");
  });

  test("is deterministic for a fresh context with the same seed, type, and vibe", () => {
    const input = {
      seed: "  ASHLEY@FUEL.BUILD ",
      type: WAVE_TYPE,
      vibe: "daybreak",
    };
    const first = generateWave(createAvatarContext(input));
    const second = generateWave(createAvatarContext(input));

    expect(second).toEqual(first);
    expect(hashHex(["wave", JSON.stringify(first)])).toBe(
      "ef618c6967be6de9c984c24eb646fe80",
    );
  });

  test("renders non-empty 512 viewBox SVGs that vary across seeds and vibes", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: WAVE_TYPE,
      vibe: "ocean",
    });
    const secondCtx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: WAVE_TYPE,
      vibe: "sunset",
    });
    const first = renderAvatarSvg(firstCtx, VIBES.ocean, generateWave(firstCtx));
    const second = renderAvatarSvg(secondCtx, VIBES.sunset, generateWave(secondCtx));

    expect(first).toContain('viewBox="0 0 512 512"');
    expect(second).toContain('viewBox="0 0 512 512"');
    expect(first.match(/<path /g)?.length).toBeGreaterThanOrEqual(4);
    expect(second.match(/<path /g)?.length).toBeGreaterThanOrEqual(4);
    expect(first).toContain(VIBES.ocean.palette.primary);
    expect(second).toContain(VIBES.sunset.palette.secondary);
    expect(second).not.toBe(first);
  });
});
