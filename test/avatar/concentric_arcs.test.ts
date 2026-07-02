import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { CONCENTRIC_ARCS_TYPE, generateConcentricArcs } from "../../src/avatar/types/concentric_arcs";

describe("concentric arcs avatar generator", () => {
  test("returns valid structured circular arc layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: CONCENTRIC_ARCS_TYPE,
      vibe: "ocean",
    });
    const artwork = generateConcentricArcs(ctx);
    const arcLayer = artwork.layers.find((layer) => layer.id === "concentric-arcs");

    expect(artwork.layers).toHaveLength(3);
    expect(arcLayer?.shapes.length).toBeGreaterThanOrEqual(12);
    expect(arcLayer?.shapes.length).toBeLessThanOrEqual(18);
    expect(
      arcLayer?.shapes.every(
        (shape) =>
          shape.kind === "path" &&
          shape.fill === "none" &&
          shape.stroke != null &&
          typeof shape.stroke !== "string" &&
          shape.d.startsWith("M") &&
          shape.d.includes(" A"),
      ),
    ).toBe(true);
  });

  test("renders deterministic non-empty 512 viewBox SVG geometry", () => {
    const request = {
      seed: "  ASHLEY@FUEL.BUILD ",
      type: CONCENTRIC_ARCS_TYPE,
      vibe: "daybreak",
    };
    const firstCtx = createAvatarContext(request);
    const secondCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: CONCENTRIC_ARCS_TYPE,
      vibe: "daybreak",
    });
    const firstSvg = renderAvatarSvg(firstCtx, VIBES.daybreak, generateConcentricArcs(firstCtx));
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.daybreak, generateConcentricArcs(secondCtx));

    expect(firstSvg).toBe(secondSvg);
    expect(firstSvg).toContain('viewBox="0 0 512 512"');
    expect(firstSvg).toContain("<path");
    expect(firstSvg).toContain(" A");
    expect(hashHex(["concentric-arcs", firstSvg])).toBe(
      "b2f4bd38417aa6c0d63ea8b140c876fc",
    );
  });

  test("keeps vibe colors out of structured output while varying across seeds and vibes", () => {
    const oceanCtx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: CONCENTRIC_ARCS_TYPE,
      vibe: "ocean",
    });
    const sunsetCtx = createAvatarContext({
      seed: "team-fuel",
      type: CONCENTRIC_ARCS_TYPE,
      vibe: "sunset",
    });
    const oceanArtwork = generateConcentricArcs(oceanCtx);
    const sunsetArtwork = generateConcentricArcs(sunsetCtx);
    const structured = JSON.stringify(oceanArtwork);
    const oceanSvg = renderAvatarSvg(oceanCtx, VIBES.ocean, oceanArtwork);
    const sunsetSvg = renderAvatarSvg(sunsetCtx, VIBES.sunset, sunsetArtwork);

    expect(structured).not.toContain(VIBES.ocean.palette.primary);
    expect(structured).not.toContain(VIBES.ocean.background.from);
    expect(oceanSvg).toContain(VIBES.ocean.palette.primary);
    expect(sunsetSvg).toContain(VIBES.sunset.palette.primary);
    expect(oceanSvg).not.toBe(sunsetSvg);
  });
});
