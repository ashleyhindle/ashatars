import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  renderAvatarSvg,
  VIBES,
} from "../../src/avatar";
import { generateSunrise, SUNRISE_TYPE } from "../../src/avatar/types/sunrise";

describe("sunrise avatar generator", () => {
  test("returns deterministic structured line and path layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: SUNRISE_TYPE,
      vibe: "daybreak",
    });
    const first = generateSunrise(ctx);
    const second = generateSunrise(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: SUNRISE_TYPE,
        vibe: "daybreak",
      }),
    );

    expect(first).toEqual(second);
    expect(first.layers.map((layer) => layer.id)).toEqual([
      "sunrise-rays",
      "sunrise-sun",
      "sunrise-bands",
      "sunrise-reflections",
    ]);
    expect(first.layers.flatMap((layer) => layer.shapes).length).toBeGreaterThanOrEqual(
      13,
    );
    expect(
      first.layers.flatMap((layer) => layer.shapes).every((shape) => shape.kind === "path"),
    ).toBe(true);
  });

  test("renders byte-identical valid SVG for the same seed, type, and vibe", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: SUNRISE_TYPE,
      vibe: "ocean",
    });
    const svg = renderAvatarSvg(ctx, VIBES.ocean, generateSunrise(ctx));
    const secondCtx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: SUNRISE_TYPE,
      vibe: "ocean",
    });
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.ocean, generateSunrise(secondCtx));

    expect(svg).toBe(secondSvg);
    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('id="sunrise-sun"');
    expect(svg).toContain(" A");
    expect(svg).toContain(" H512");
    expect(svg.match(/<path /g)?.length).toBeGreaterThanOrEqual(13);
  });

  test("keeps vibe colors in the renderer rather than generator output", () => {
    const ctx = createAvatarContext({
      seed: "Mixed Case Team",
      type: SUNRISE_TYPE,
      vibe: "sunset",
    });
    const artwork = generateSunrise(ctx);
    const structured = JSON.stringify(artwork);
    const svg = renderAvatarSvg(ctx, VIBES.sunset, artwork);

    expect(structured).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(structured).not.toContain(VIBES.sunset.palette.primary);
    expect(svg).toContain(VIBES.sunset.palette.primary);
  });

  test("varies geometry across seeds and vibes", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: SUNRISE_TYPE,
      vibe: "daybreak",
    });
    const secondCtx = createAvatarContext({
      seed: "morning-team",
      type: SUNRISE_TYPE,
      vibe: "forest",
    });

    expect(renderAvatarSvg(firstCtx, VIBES.daybreak, generateSunrise(firstCtx))).not.toBe(
      renderAvatarSvg(secondCtx, VIBES.forest, generateSunrise(secondCtx)),
    );
  });
});
