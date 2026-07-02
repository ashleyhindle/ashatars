export const AVATAR_SIZE = 512;
export const AVATAR_VERSION = "ashatars-v1";

export type SeedKind = "email" | "uuid" | "string";

export interface NormalizedSeed {
  readonly raw: string;
  readonly normalized: string;
  readonly kind: SeedKind;
  readonly hash: string;
}

export interface DeterministicRng {
  next(): number;
  int(min: number, maxInclusive: number): number;
  float(min: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  fork(label: string): DeterministicRng;
}

export interface AvatarContext {
  readonly size: number;
  readonly version: string;
  readonly seed: NormalizedSeed;
  readonly type: string;
  readonly vibe: string;
  readonly rng: DeterministicRng;
}

export type AvatarErrorCode = "invalid_type" | "invalid_vibe" | "empty_types";

export interface AvatarError {
  readonly code: AvatarErrorCode;
  readonly message: string;
  readonly value?: string;
  readonly supported?: readonly string[];
}

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: AvatarError };

export function normalizeSeed(rawSeed: string): NormalizedSeed {
  const raw = String(rawSeed);
  const trimmed = raw.trim();
  const kind = seedKind(trimmed);
  const normalized = kind === "email" ? trimmed.toLowerCase() : trimmed;

  return {
    raw,
    normalized,
    kind,
    hash: hashHex(["seed", normalized]),
  };
}

export function createAvatarContext(input: {
  readonly seed: string | NormalizedSeed;
  readonly type: string;
  readonly vibe: string;
  readonly version?: string;
}): AvatarContext {
  const seed = typeof input.seed === "string" ? normalizeSeed(input.seed) : input.seed;
  const version = input.version ?? AVATAR_VERSION;

  return {
    size: AVATAR_SIZE,
    version,
    seed,
    type: input.type,
    vibe: input.vibe,
    rng: createRng([version, seed.normalized, input.type, input.vibe]),
  };
}

export function resolveAvatarType(input: {
  readonly seed: string | NormalizedSeed;
  readonly supportedTypes: readonly string[];
  readonly type?: string | null;
  readonly repeatedTypes?: readonly string[];
  readonly types?: string | null;
}): Result<string> {
  const supported = input.supportedTypes.map(normalizeIdentifier);
  const supportedSet = new Set(supported);
  const seed = typeof input.seed === "string" ? normalizeSeed(input.seed) : input.seed;
  const singleType = normalizeOptionalIdentifier(input.type);
  const repeatedTypes = (input.repeatedTypes ?? []).map(normalizeIdentifier).filter(Boolean);
  const commaTypes = splitTypes(input.types);

  if (singleType && repeatedTypes.length === 0 && commaTypes.length === 0) {
    return supportedSet.has(singleType)
      ? { ok: true, value: singleType }
      : invalidType(singleType, supported);
  }

  const requested = unique([...repeatedTypes, ...commaTypes]);
  if (requested.length === 0) {
    if (supported.length === 0) {
      return {
        ok: false,
        error: {
          code: "empty_types",
          message: "No avatar types are available.",
          supported,
        },
      };
    }

    return { ok: true, value: chooseType(seed, supported) };
  }

  const invalid = requested.find((type) => !supportedSet.has(type));
  if (invalid) {
    return invalidType(invalid, supported);
  }

  return { ok: true, value: chooseType(seed, requested) };
}

export function hashHex(parts: readonly string[]): string {
  return hashParts(parts)
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
}

export function hashToIndex(parts: readonly string[], modulo: number): number {
  if (!Number.isSafeInteger(modulo) || modulo <= 0) {
    throw new Error("Modulo must be a positive safe integer.");
  }

  return hashParts(parts)[0] % modulo;
}

export function createRng(parts: readonly string[]): DeterministicRng {
  return new Sfc32Rng(hashParts(parts));
}

function chooseType(seed: NormalizedSeed, candidates: readonly string[]): string {
  return candidates[hashToIndex(["type", seed.normalized, candidates.join(",")], candidates.length)]!;
}

function invalidType(value: string, supported: readonly string[]): Result<string> {
  return {
    ok: false,
    error: {
      code: "invalid_type",
      message: `Unsupported avatar type: ${value}`,
      value,
      supported,
    },
  };
}

function splitTypes(types: string | null | undefined): string[] {
  if (!types) {
    return [];
  }

  return types
    .split(",")
    .map(normalizeIdentifier)
    .filter(Boolean);
}

function normalizeOptionalIdentifier(value: string | null | undefined): string | undefined {
  const normalized = value == null ? "" : normalizeIdentifier(value);
  return normalized || undefined;
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function seedKind(value: string): SeedKind {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return "email";
  }

  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)) {
    return "uuid";
  }

  return "string";
}

function hashParts(parts: readonly string[]): [number, number, number, number] {
  return cyrb128(parts.join("\u001f"));
}

function cyrb128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let index = 0; index < input.length; index += 1) {
    const key = input.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ key, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ key, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ key, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ key, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;

  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

class Sfc32Rng implements DeterministicRng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: readonly [number, number, number, number]) {
    [this.a, this.b, this.c, this.d] = seed;
  }

  next(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    const t = (this.a + this.b + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;

    return (t >>> 0) / 4294967296;
  }

  int(min: number, maxInclusive: number): number {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(maxInclusive) || min > maxInclusive) {
      throw new Error("Invalid integer range.");
    }

    return Math.floor(this.next() * (maxInclusive - min + 1)) + min;
  }

  float(min: number, maxExclusive: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(maxExclusive) || min >= maxExclusive) {
      throw new Error("Invalid float range.");
    }

    return this.next() * (maxExclusive - min) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty list.");
    }

    return items[this.int(0, items.length - 1)]!;
  }

  fork(label: string): DeterministicRng {
    return createRng([String(this.a), String(this.b), String(this.c), String(this.d), label]);
  }
}
