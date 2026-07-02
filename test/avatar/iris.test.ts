import { describe, expect, test } from "bun:test";
import { createAvatarContext, hashHex, renderAvatarSvg, VIBES } from "../../src/avatar";
import { generateIris } from "../../src/avatar/types/iris";

describe("iris avatar generator", () => {
  test("returns structured mechanical petal and path layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "iris",
      vibe: "daybreak",
    });
    const artwork = generateIris(ctx);
    const petalLayer = artwork.layers.find((layer) => layer.id === "iris-petals");
    const seamLayer = artwork.layers.find((layer) => layer.id === "iris-seams");

    expect(artwork.layers.map((layer) => layer.id)).toEqual([
      "iris-housing",
      "iris-petals",
      "iris-seams",
      "iris-aperture",
    ]);
    expect(petalLayer?.shapes.length).toBeGreaterThanOrEqual(7);
    expect(petalLayer?.shapes.length).toBeLessThanOrEqual(12);
    expect(seamLayer?.shapes.length).toBe(petalLayer?.shapes.length);
    expect(artwork.layers.every((layer) => layer.shapes.every((shape) => shape.kind === "path"))).toBe(
      true,
    );
    expect(petalLayer?.shapes.every((shape) => shape.id?.startsWith("iris-petal-"))).toBe(true);
  });

  test("renders deterministic non-empty 512 viewBox SVG", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "iris",
      vibe: "ocean",
    });
    const first = renderAvatarSvg(ctx, VIBES.ocean, generateIris(ctx));
    const secondCtx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "iris",
      vibe: "ocean",
    });
    const second = renderAvatarSvg(secondCtx, VIBES.ocean, generateIris(secondCtx));

    expect(first).toBe(second);
    expect(first).toContain('viewBox="0 0 512 512"');
    expect(first).toContain('id="iris-petals"');
    expect(first).toContain('id="iris-aperture"');
    expect(first.length).toBeGreaterThan(3200);
    expect(hashHex(["iris-snapshot", first])).toBe("340bb1b5d8463b50baaaafebee35c6f6");
  });

  test("keeps vibe colors outside generated structure and varies by input", () => {
    const daybreakCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "iris",
      vibe: "daybreak",
    });
    const fireCtx = createAvatarContext({
      seed: "mechanical@example.com",
      type: "iris",
      vibe: "fire",
    });
    const daybreakArtwork = generateIris(daybreakCtx);
    const fireArtwork = generateIris(fireCtx);
    const serialized = JSON.stringify(daybreakArtwork);

    expect(serialized).not.toContain("#");
    expect(serialized).not.toContain(VIBES.daybreak.palette.primary);
    expect(serialized).toContain('"role":"primary"');
    expect(serialized).toContain('"role":"contrast"');
    expect(renderAvatarSvg(daybreakCtx, VIBES.daybreak, daybreakArtwork)).not.toBe(
      renderAvatarSvg(fireCtx, VIBES.fire, fireArtwork),
    );
  });
});
