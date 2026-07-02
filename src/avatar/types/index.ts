import type { AvatarContext } from "../core";
import type { AvatarArtwork } from "../render";
import { BLOB_FACE_TYPE, generateBlobFace } from "./blob-face";
import { CARETS_TYPE, generateCarets } from "./carets";
import { CIRCLES_TYPE, generateCircles } from "./circles";
import { CLOCK_TYPE, generateClock } from "./clock";
import { CONCENTRIC_ARCS_TYPE, generateConcentricArcs } from "./concentric_arcs";
import { DIAGONAL_GRID_TYPE, generateDiagonalGrid } from "./diagonal-grid";
import { DOTS_TYPE, generateDots } from "./dots";
import { GRID_TYPE, generateGrid } from "./grid";
import { IRIS_TYPE, generateIris } from "./iris";
import { LINES_TYPE, generateLines } from "./lines";
import { MOUNTAINS_TYPE, generateMountains } from "./mountains";
import { SQUARES_TYPE, generateSquares } from "./squares";
import { SUNRISE_TYPE, generateSunrise } from "./sunrise";
import { WAVE_TYPE, generateWave } from "./wave";
import { WIGGLES_TYPE, generateWiggles } from "./wiggles";
import { ZIGZAG_VERTICAL_TYPE, generateZigzagVertical } from "./zigzag_vertical";

export interface AvatarGenerator {
  readonly type: string;
  generate(ctx: AvatarContext): AvatarArtwork;
}

export const AVATAR_GENERATORS = {
  [CIRCLES_TYPE]: {
    type: CIRCLES_TYPE,
    generate: generateCircles,
  },
  [LINES_TYPE]: {
    type: LINES_TYPE,
    generate: generateLines,
  },
  [GRID_TYPE]: {
    type: GRID_TYPE,
    generate: generateGrid,
  },
  [DIAGONAL_GRID_TYPE]: {
    type: DIAGONAL_GRID_TYPE,
    generate: generateDiagonalGrid,
  },
  [SQUARES_TYPE]: {
    type: SQUARES_TYPE,
    generate: generateSquares,
  },
  [MOUNTAINS_TYPE]: {
    type: MOUNTAINS_TYPE,
    generate: generateMountains,
  },
  [ZIGZAG_VERTICAL_TYPE]: {
    type: ZIGZAG_VERTICAL_TYPE,
    generate: generateZigzagVertical,
  },
  [WIGGLES_TYPE]: {
    type: WIGGLES_TYPE,
    generate: generateWiggles,
  },
  [SUNRISE_TYPE]: {
    type: SUNRISE_TYPE,
    generate: generateSunrise,
  },
  [CLOCK_TYPE]: {
    type: CLOCK_TYPE,
    generate: generateClock,
  },
  [DOTS_TYPE]: {
    type: DOTS_TYPE,
    generate: generateDots,
  },
  [CONCENTRIC_ARCS_TYPE]: {
    type: CONCENTRIC_ARCS_TYPE,
    generate: generateConcentricArcs,
  },
  [IRIS_TYPE]: {
    type: IRIS_TYPE,
    generate: generateIris,
  },
  [WAVE_TYPE]: {
    type: WAVE_TYPE,
    generate: generateWave,
  },
  [BLOB_FACE_TYPE]: {
    type: BLOB_FACE_TYPE,
    generate: generateBlobFace,
  },
  [CARETS_TYPE]: {
    type: CARETS_TYPE,
    generate: generateCarets,
  },
} as const satisfies Record<string, AvatarGenerator>;

export type AvatarType = keyof typeof AVATAR_GENERATORS;

export const SUPPORTED_AVATAR_TYPES = Object.keys(AVATAR_GENERATORS) as AvatarType[];

export function getAvatarGenerator(type: string): AvatarGenerator | undefined {
  return AVATAR_GENERATORS[type as AvatarType];
}

export { BLOB_FACE_TYPE, generateBlobFace } from "./blob-face";
export { CARETS_TYPE, generateCarets } from "./carets";
export { CIRCLES_TYPE, generateCircles } from "./circles";
export { CLOCK_TYPE, generateClock, generateSpacedClockAngles } from "./clock";
export { CONCENTRIC_ARCS_TYPE, generateConcentricArcs } from "./concentric_arcs";
export { DIAGONAL_GRID_TYPE, generateDiagonalGrid } from "./diagonal-grid";
export { DOTS_TYPE, generateDots } from "./dots";
export { GRID_TYPE, generateGrid } from "./grid";
export { IRIS_TYPE, generateIris } from "./iris";
export { LINES_TYPE, generateLines } from "./lines";
export { MOUNTAINS_TYPE, generateMountains } from "./mountains";
export { SQUARES_TYPE, generateSquares } from "./squares";
export { SUNRISE_TYPE, generateSunrise } from "./sunrise";
export { WAVE_TYPE, generateWave } from "./wave";
export { WIGGLES_TYPE, generateWiggles } from "./wiggles";
export { ZIGZAG_VERTICAL_TYPE, generateZigzagVertical } from "./zigzag_vertical";
