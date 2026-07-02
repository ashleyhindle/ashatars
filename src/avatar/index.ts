import {
  type AvatarError,
  type Result,
  createAvatarContext,
  normalizeSeed,
  resolveAvatarType,
} from "./core";
import { renderAvatarSvg } from "./render";
import { ALL_AVATAR_TYPES, getAvatarGenerator, SUPPORTED_AVATAR_TYPES } from "./types";
import { DEFAULT_VIBE, resolveVibe } from "./vibes";

export interface AvatarRequest {
  readonly seed: string;
  readonly type?: string | null;
  readonly repeatedTypes?: readonly string[];
  readonly types?: string | null;
  readonly vibe?: string | null;
}

export interface RenderedAvatar {
  readonly seed: ReturnType<typeof normalizeSeed>;
  readonly type: string;
  readonly vibe: string;
  readonly svg: string;
}

export function createAvatarSvg(request: AvatarRequest): Result<RenderedAvatar> {
  const seed = normalizeSeed(request.seed);
  const explicitTypeSelection =
    Boolean(request.type?.trim()) ||
    (request.repeatedTypes?.some((type) => Boolean(type.trim())) ?? false) ||
    Boolean(request.types?.trim());
  const typeResult = resolveAvatarType({
    seed,
    supportedTypes: explicitTypeSelection ? ALL_AVATAR_TYPES : SUPPORTED_AVATAR_TYPES,
    type: request.type,
    repeatedTypes: request.repeatedTypes,
    types: request.types,
  });

  if (!typeResult.ok) {
    return typeResult;
  }

  const vibeResult = resolveVibe(request.vibe ?? DEFAULT_VIBE);
  if (!vibeResult.ok) {
    return vibeResult;
  }

  const generator = getAvatarGenerator(typeResult.value);
  if (!generator) {
    return {
      ok: false,
      error: {
        code: "invalid_type",
        message: `Unsupported avatar type: ${typeResult.value}`,
        value: typeResult.value,
        supported: explicitTypeSelection ? ALL_AVATAR_TYPES : SUPPORTED_AVATAR_TYPES,
      } satisfies AvatarError,
    };
  }

  const ctx = createAvatarContext({
    seed,
    type: typeResult.value,
    vibe: vibeResult.value.id,
  });
  const artwork = generator.generate(ctx);
  const svg = renderAvatarSvg(ctx, vibeResult.value, artwork);

  return {
    ok: true,
    value: {
      seed,
      type: typeResult.value,
      vibe: vibeResult.value.id,
      svg,
    },
  };
}

export * from "./core";
export * from "./render";
export * from "./types";
export * from "./vibes";
