import { describe, expect, test } from "bun:test";
import {
  createAvatarContext,
  createAvatarSvg,
  getAvatarGenerator,
  hashHex,
  normalizeSeed,
  resolveAvatarType,
  resolveVibe,
  renderAvatarSvg,
  ALL_AVATAR_TYPES,
  SUPPORTED_AVATAR_TYPES,
  VIBES,
  DEFAULT_VIBE,
} from "../../src/avatar";
import {
  generateCircles,
  MIN_CIRCLES_VISIBLE_FRACTION,
  visibleCircleFractionAfterAvatarClip,
} from "../../src/avatar/types/circles";
import { DOT_COUNTS, generateDots } from "../../src/avatar/types/dots";
import type { CircleShape } from "../../src/avatar/render";

const PUBLIC_TYPES = [
  "circles",
  "lines",
  "grid",
  "diagonal_grid",
  "squares",
  "mountains",
  "zigzag_vertical",
  "wiggles",
  "sunrise",
  "clock",
  "dots",
  "concentric_arcs",
  "iris",
  "wave",
  "blob_face",
] as const;

const IMPLEMENTED_TYPES = [...PUBLIC_TYPES, "carets"] as const;

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
      type: "not-a-type",
    });
    const vibe = resolveVibe("nope");

    expect(type.ok).toBe(false);
    if (!type.ok) {
      expect(type.error.code).toBe("invalid_type");
      expect(type.error.supported).toEqual([...PUBLIC_TYPES]);
    }

    expect(vibe.ok).toBe(false);
    if (!vibe.ok) {
      expect(vibe.error.code).toBe("invalid_vibe");
      expect(vibe.error.supported).toContain("daybreak");
      expect(vibe.error.supported).toContain("stealth");
    }
  });

  test("lists every implemented type once in the supported registry", () => {
    expect(ALL_AVATAR_TYPES).toEqual([...IMPLEMENTED_TYPES]);
    expect(SUPPORTED_AVATAR_TYPES).toEqual([...PUBLIC_TYPES]);
    expect(SUPPORTED_AVATAR_TYPES).not.toContain("carets");
    expect(getAvatarGenerator("carets")?.type).toBe("carets");
    expect(new Set(SUPPORTED_AVATAR_TYPES).size).toBe(SUPPORTED_AVATAR_TYPES.length);

    for (const type of ALL_AVATAR_TYPES) {
      expect(getAvatarGenerator(type)?.type).toBe(type);
    }
  });

  test("renders every implemented type through the avatar factory, including undocumented carets", () => {
    for (const type of ALL_AVATAR_TYPES) {
      const avatar = createAvatarSvg({
        seed: "ashley@fuel.build",
        type,
        vibe: "daybreak",
      });

      expect(avatar.ok).toBe(true);
      if (avatar.ok) {
        expect(avatar.value.type).toBe(type);
        expect(avatar.value.svg).toContain('viewBox="0 0 512 512"');
      }
    }
  });

  test("selects deterministic supported types from all types when type params are omitted", () => {
    const supported = SUPPORTED_AVATAR_TYPES.join(",");
    const fromTypes = createAvatarSvg({
      seed: "ashley@fuel.build",
      types: supported,
    });
    const fromTypesAgain = createAvatarSvg({
      seed: "ashley@fuel.build",
      types: supported,
    });
    const defaultType = createAvatarSvg({
      seed: "ashley@fuel.build",
    });

    expect(fromTypes.ok).toBe(true);
    expect(fromTypesAgain.ok).toBe(true);
    expect(defaultType.ok).toBe(true);
    if (fromTypes.ok && fromTypesAgain.ok && defaultType.ok) {
      expect(fromTypes.value.type).toBe(fromTypesAgain.value.type);
      expect(fromTypes.value.type).toBe(defaultType.value.type);
      expect(fromTypes.value.vibe).toBe(DEFAULT_VIBE);
      expect(defaultType.value.vibe).toBe("stealth");
      expect(SUPPORTED_AVATAR_TYPES as readonly string[]).toContain(fromTypes.value.type);
      expect(SUPPORTED_AVATAR_TYPES as readonly string[]).toContain(defaultType.value.type);
      expect(defaultType.value.type).not.toBe("carets");
    }
  });

  test("uses vibe for the background while keeping mark color stable by contrast", () => {
    const daybreak = createAvatarSvg({
      seed: "ashley@fuel.build",
      type: "lines",
      vibe: "daybreak",
    });
    const ocean = createAvatarSvg({
      seed: "ashley@fuel.build",
      type: "lines",
      vibe: "ocean",
    });
    const stealth = createAvatarSvg({
      seed: "ashley@fuel.build",
      type: "lines",
      vibe: "stealth",
    });

    expect(daybreak.ok).toBe(true);
    expect(ocean.ok).toBe(true);
    expect(stealth.ok).toBe(true);
    if (daybreak.ok && ocean.ok && stealth.ok) {
      expect(backgroundColors(daybreak.value.svg)).toEqual([
        VIBES.daybreak.background.from,
        VIBES.daybreak.background.to,
      ]);
      expect(backgroundColors(ocean.value.svg)).toEqual([
        VIBES.ocean.background.from,
        VIBES.ocean.background.to,
      ]);
      expect(backgroundColors(stealth.value.svg)).toEqual([
        VIBES.stealth.background.from,
        VIBES.stealth.background.to,
      ]);
      expect(backgroundColors(daybreak.value.svg)).not.toEqual(backgroundColors(ocean.value.svg));
      expect(markColors(daybreak.value.svg)).toEqual([VIBES.daybreak.foreground]);
      expect(markColors(ocean.value.svg)).toEqual([VIBES.daybreak.foreground]);
      expect(markColors(stealth.value.svg)).toEqual([VIBES.stealth.foreground]);
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

  test("allows low dot counts while keeping dots large enough for thumbnails", () => {
    expect(Math.min(...DOT_COUNTS)).toBe(3);
    expect(Math.max(...DOT_COUNTS)).toBeLessThanOrEqual(18);

    const lowCountArtwork = Array.from({ length: 80 }, (_, index) =>
      generateDots(
        createAvatarContext({
          seed: `low-dot-count-${index}`,
          type: "dots",
          vibe: "stealth",
        }),
      ),
    ).find((artwork) => artwork.layers[0]!.shapes.length === 3);

    expect(lowCountArtwork).toBeDefined();
    const shapes = lowCountArtwork!.layers.flatMap((layer) => layer.shapes) as CircleShape[];
    const xs = shapes.map((shape) => shape.cx);
    const ys = shapes.map((shape) => shape.cy);

    expect(shapes).toHaveLength(3);
    expect(shapes.every((shape) => shape.r >= 22)).toBe(true);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(180);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(180);
    expect(Math.hypot(average(xs) - 256, average(ys) - 256)).toBeLessThanOrEqual(80);
    expect(shapes.every((shape) => Math.hypot(shape.cx - 256, shape.cy - 256) + shape.r <= 228)).toBe(true);
  });

  test("keeps representative dots legible, centered, and broadly distributed", () => {
    for (const seed of ["ashley@fuel.build", "7db79f08-6b58-434d-a58d-3309b9eb0975"]) {
      const artwork = generateDots(
        createAvatarContext({
          seed,
          type: "dots",
          vibe: "stealth",
        }),
      );
      const shapes = artwork.layers.flatMap((layer) => layer.shapes) as CircleShape[];
      const xs = shapes.map((shape) => shape.cx);
      const ys = shapes.map((shape) => shape.cy);
      const quadrants = new Set(
        shapes.map((shape) => `${shape.cx >= 256 ? "r" : "l"}${shape.cy >= 256 ? "b" : "t"}`),
      );
      const averageX = average(xs);
      const averageY = average(ys);

      expect(shapes.length).toBeGreaterThanOrEqual(8);
      expect(shapes.every((shape) => shape.r >= 18)).toBe(true);
      expect(shapes.every((shape) => shape.r <= 40)).toBe(true);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(300);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(300);
      expect(quadrants.size).toBeGreaterThanOrEqual(4);
      expect(averageX).toBeGreaterThanOrEqual(190);
      expect(averageX).toBeLessThanOrEqual(322);
      expect(averageY).toBeGreaterThanOrEqual(190);
      expect(averageY).toBeLessThanOrEqual(322);

      for (const shape of shapes) {
        expect(shape.cx - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cy - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cx + shape.r).toBeLessThanOrEqual(512);
        expect(shape.cy + shape.r).toBeLessThanOrEqual(512);
        expect(Math.hypot(shape.cx - 256, shape.cy - 256) + shape.r).toBeLessThanOrEqual(228);
      }
    }
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
        "bdc7f57049150a947a743aae8c7b3148",
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

function backgroundColors(svg: string): string[] {
  return [...svg.matchAll(/stop-color="(#[0-9a-f]{6})"/g)].map((match) => match[1]!);
}

function markColors(svg: string): string[] {
  return [
    ...new Set(
      [...svg.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g)].map((match) => match[1]!),
    ),
  ];
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

describe("circles avatar generator", () => {
  test("returns deterministic sparse circle outlines with meaningful circular visibility", () => {
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
    expect(first.layers.map((layer) => layer.id)).toEqual(["circles"]);

    const shapes = first.layers.flatMap((layer) => layer.shapes);
    expect(shapes.length).toBeGreaterThanOrEqual(2);
    expect(shapes.length).toBeLessThanOrEqual(7);
    expect(shapes.every((shape) => shape.kind === "circle")).toBe(true);

    for (const shape of shapes) {
      expect(shape.kind).toBe("circle");
      if (shape.kind === "circle") {
        expect(visibleCircleFractionAfterAvatarClip(shape)).toBeGreaterThanOrEqual(
          MIN_CIRCLES_VISIBLE_FRACTION,
        );
      }
    }
  });

  test("keeps the reported stealth circles seed from becoming a corner-only speck", () => {
    const artwork = generateCircles(
      createAvatarContext({
        seed: "2ad060ea-d437-4435-a453-27ee0ea660a3",
        type: "circles",
        vibe: "stealth",
      }),
    );
    const shapes = artwork.layers.flatMap((layer) => layer.shapes) as CircleShape[];

    expect(shapes.length).toBeGreaterThanOrEqual(2);
    expect(shapes.length).toBeLessThanOrEqual(7);
    expect(
      shapes.every((shape) => visibleCircleFractionAfterAvatarClip(shape) >= MIN_CIRCLES_VISIBLE_FRACTION),
    ).toBe(true);
  });

  test("keeps circles count and circular-clip visibility invariant across representative seeds", () => {
    for (const seed of [
      "ashley@fuel.build",
      "2ad060ea-d437-4435-a453-27ee0ea660a3",
      "7db79f08-6b58-434d-a58d-3309b9eb0975",
      "Mixed Case Team",
      "corner regression",
    ]) {
      for (const vibe of ["daybreak", "stealth", "ocean"]) {
        const artwork = generateCircles(createAvatarContext({ seed, type: "circles", vibe }));
        const shapes = artwork.layers.flatMap((layer) => layer.shapes) as CircleShape[];

        expect(shapes.length).toBeGreaterThanOrEqual(2);
        expect(shapes.length).toBeLessThanOrEqual(7);
        expect(
          shapes.every(
            (shape) => visibleCircleFractionAfterAvatarClip(shape) >= MIN_CIRCLES_VISIBLE_FRACTION,
          ),
        ).toBe(true);
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
    expect(svg).toContain('id="circles"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain(VIBES.ocean.palette.primary);
    expect(JSON.stringify(artwork)).not.toContain("#");
  });
});
