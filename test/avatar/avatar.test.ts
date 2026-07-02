import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  createAvatarSvg,
  hashHex,
  normalizeSeed,
  resolveAvatarType,
  resolveVibe,
  renderAvatarSvg,
  SUPPORTED_AVATAR_TYPES,
  VIBES,
} from "../../src/avatar";
import { generateCircles } from "../../src/avatar/types/circles";
import { generateDots } from "../../src/avatar/types/dots";

describe("deterministic avatar core", () => {
  test("normalizes email seeds with trim and lowercase", () => {
    const seed = normalizeSeed("  Ashley@Fuel.Build  ");

    expect(seed.kind).toBe("email");
    expect(seed.normalized).toBe("ashley@fuel.build");
    expect(seed.hash).toBe(hashHex(["seed", "ashley@fuel.build"]));
  });

  test("trims UUID and string seeds without lowercasing them", () => {
    const uuid = normalizeSeed("  7DB79F08-6B58-434D-A58D-3309B9EB0975  ");
    const text = normalizeSeed("  Mixed Case Team  ");

    expect(uuid.kind).toBe("uuid");
    expect(uuid.normalized).toBe("7DB79F08-6B58-434D-A58D-3309B9EB0975");
    expect(text.kind).toBe("string");
    expect(text.normalized).toBe("Mixed Case Team");
  });

  test("selects one supported type deterministically from repeated type values", () => {
    const first = resolveAvatarType({
      seed: "ashley@fuel.build",
      supportedTypes: ["dots", "lines", "wave"],
      repeatedTypes: ["dots", "wave", "lines"],
    });
    const second = resolveAvatarType({
      seed: "  ASHLEY@FUEL.BUILD ",
      supportedTypes: ["dots", "lines", "wave"],
      repeatedTypes: ["dots", "wave", "lines"],
    });

    expect(first).toEqual(second);
    expect(first).toEqual({ ok: true, value: "dots" });
  });

  test("selects one supported type deterministically from types query lists", () => {
    const first = resolveAvatarType({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      supportedTypes: ["dots", "lines", "wave"],
      types: "dots,lines,wave",
    });
    const second = resolveAvatarType({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      supportedTypes: ["dots", "lines", "wave"],
      types: "dots,lines,wave",
    });

    expect(first).toEqual(second);
    expect(first).toEqual({ ok: true, value: "wave" });
  });

  test("represents invalid type and vibe as typed errors", () => {
    const type = resolveAvatarType({
      seed: "ashley@fuel.build",
      supportedTypes: SUPPORTED_AVATAR_TYPES,
      type: "clock",
    });
    const vibe = resolveVibe("nope");

    expect(type.ok).toBe(false);
    if (!type.ok) {
      expect(type.error.code).toBe("invalid_type");
      expect(type.error.supported).toEqual(["dots"]);
    }

    expect(vibe.ok).toBe(false);
    if (!vibe.ok) {
      expect(vibe.error.code).toBe("invalid_vibe");
      expect(vibe.error.supported).toContain("daybreak");
    }
  });
});

describe("dots avatar exemplar", () => {
  test("returns valid structured layers", () => {
    const ctx = createAvatarContext({
      seed: "ashley@fuel.build",
      type: "dots",
      vibe: "daybreak",
    });
    const artwork = generateDots(ctx);

    expect(artwork.layers).toHaveLength(1);
    expect(artwork.layers[0]?.id).toBe("dots");
    expect(artwork.layers[0]?.shapes.length).toBeGreaterThanOrEqual(3);
    expect(artwork.layers[0]?.shapes.length).toBeLessThanOrEqual(24);
    expect(artwork.layers[0]?.shapes.every((shape) => shape.kind === "circle")).toBe(true);
  });

  test("renders byte-identical SVG for the same seed, type, and vibe", () => {
    const first = createAvatarSvg({
      seed: "  ASHLEY@FUEL.BUILD ",
      type: "dots",
      vibe: "daybreak",
    });
    const second = createAvatarSvg({
      seed: "ashley@fuel.build",
      type: "dots",
      vibe: "daybreak",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.value.svg).toBe(second.value.svg);
      expect(hashHex(["snapshot", first.value.svg])).toBe(
        "5127962c791364cc8430b5218ecdce93",
      );
    }
  });

  test("renders a valid SVG document with palette roles resolved outside the generator", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "dots",
      vibe: "ocean",
    });
    const svg = renderAvatarSvg(ctx, VIBES.ocean, generateDots(ctx));

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('fill="url(#bg)"');
    expect(svg).toContain(VIBES.ocean.palette.primary);
    const structured = generateDots(
      createAvatarContext({
        seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
        type: "dots",
        vibe: "ocean",
      }),
    );
    expect(JSON.stringify(structured)).not.toContain(VIBES.ocean.palette.primary);
    expect(svg).not.toContain("Math.random");
  });
});

describe("circles avatar generator", () => {
  test("returns deterministic structured bubble layers inside the viewBox", () => {
    const first = generateCircles(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: "circles",
        vibe: "bubble",
      }),
    );
    const second = generateCircles(
      createAvatarContext({
        seed: "ashley@fuel.build",
        type: "circles",
        vibe: "bubble",
      }),
    );

    expect(first).toEqual(second);
    expect(first.layers.map((layer) => layer.id)).toEqual([
      "circles-soft",
      "circles-rings",
      "circles-accents",
    ]);

    const shapes = first.layers.flatMap((layer) => layer.shapes);
    expect(shapes.length).toBeGreaterThanOrEqual(14);
    expect(shapes.length).toBeLessThanOrEqual(26);
    expect(shapes.every((shape) => shape.kind === "circle")).toBe(true);

    for (const shape of shapes) {
      expect(shape.kind).toBe("circle");
      if (shape.kind === "circle") {
        expect(shape.cx - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cy - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cx + shape.r).toBeLessThanOrEqual(512);
        expect(shape.cy + shape.r).toBeLessThanOrEqual(512);
      }
    }
  });

  test("renders valid SVG using vibe palette roles outside the generator", () => {
    const ctx = createAvatarContext({
      seed: "7db79f08-6b58-434d-a58d-3309b9eb0975",
      type: "circles",
      vibe: "ocean",
    });
    const artwork = generateCircles(ctx);
    const svg = renderAvatarSvg(ctx, VIBES.ocean, artwork);

    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('id="circles-soft"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain("#");
  });
});
