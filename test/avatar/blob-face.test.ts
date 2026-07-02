import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  hashHex,
  renderAvatarSvg,
  VIBES,
} from "../../src/avatar";
import { BLOB_FACE_TYPE, generateBlobFace } from "../../src/avatar/types/blob-face";

describe("blob_face avatar generator", () => {
  test("returns structured grouped face geometry", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: BLOB_FACE_TYPE,
      vibe: "daybreak",
    });
    const artwork = generateBlobFace(ctx);

    expect(artwork.layers.map((layer) => layer.id)).toEqual([
      "blob-face-base",
      "blob-face-hair",
      "blob-face-features",
    ]);
    expect(artwork.layers[0]?.shapes).toHaveLength(1);
    expect(artwork.layers[1]?.shapes.length).toBeGreaterThanOrEqual(2);
    expect(artwork.layers[2]?.shapes.length).toBeGreaterThanOrEqual(7);
    expect(artwork.layers.flatMap((layer) => layer.shapes).some((shape) => shape.kind === "path")).toBe(true);
    expect(artwork.layers.flatMap((layer) => layer.shapes).some((shape) => shape.kind === "circle")).toBe(true);
  });

  test("renders deterministic non-empty 512 viewBox SVG", () => {
    const request = {
      seed: "  ASHLEY@FUEL.BUILD ",
      type: BLOB_FACE_TYPE,
      vibe: "ocean",
    };
    const firstCtx = createAvatarContext(request);
    const secondCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: BLOB_FACE_TYPE,
      vibe: "ocean",
    });
    const firstSvg = renderAvatarSvg(firstCtx, VIBES.ocean, generateBlobFace(firstCtx));
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.ocean, generateBlobFace(secondCtx));

    expect(firstSvg).toBe(secondSvg);
    expect(firstSvg).toContain('viewBox="0 0 512 512"');
    expect(firstSvg).toContain('id="face-blob"');
    expect(firstSvg).toContain('id="smile"');
    expect(firstSvg.length).toBeGreaterThan(1600);
    expect(hashHex(["blob-face", firstSvg])).toBe(hashHex(["blob-face", secondSvg]));
  });

  test("uses semantic paint roles instead of vibe colors", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: BLOB_FACE_TYPE,
      vibe: "bubble",
    });
    const artwork = generateBlobFace(ctx);
    const structured = JSON.stringify(artwork);
    const svg = renderAvatarSvg(ctx, VIBES.bubble, artwork);

    expect(structured).not.toContain("#");
    for (const color of Object.values(VIBES.bubble.palette)) {
      expect(structured).not.toContain(color);
    }
    expect(svg).toContain(VIBES.bubble.palette.contrast);
    expect(svg).toContain(VIBES.bubble.palette.soft);
  });

  test("varies across seed and vibe while remaining valid", () => {
    const firstCtx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: BLOB_FACE_TYPE,
      vibe: "daybreak",
    });
    const secondCtx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: BLOB_FACE_TYPE,
      vibe: "stealth",
    });
    const firstSvg = renderAvatarSvg(firstCtx, VIBES.daybreak, generateBlobFace(firstCtx));
    const secondSvg = renderAvatarSvg(secondCtx, VIBES.stealth, generateBlobFace(secondCtx));

    expect(firstSvg).not.toBe(secondSvg);
    expect(firstSvg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(secondSvg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(firstSvg).not.toContain("Math.random");
    expect(secondSvg).not.toContain("Math.random");
  });
});
