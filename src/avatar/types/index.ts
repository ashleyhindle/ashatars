import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { DOTS_TYPE, generateDots } from "./dots";

export interface AvatarGenerator {
  readonly type: string;
  generate(ctx: AvatarContext): AvatarArtwork;
}

export const AVATAR_GENERATORS = {
  [DOTS_TYPE]: {
    type: DOTS_TYPE,
    generate: generateDots,
  },
} as const satisfies Record<string, AvatarGenerator>;

export type AvatarType = keyof typeof AVATAR_GENERATORS;

export const SUPPORTED_AVATAR_TYPES = Object.keys(AVATAR_GENERATORS) as AvatarType[];

export function getAvatarGenerator(type: string): AvatarGenerator | undefined {
  return AVATAR_GENERATORS[type as AvatarType];
}

export { generateDots } from "./dots";
