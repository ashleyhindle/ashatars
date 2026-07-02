import type { AvatarError, Result } from "./core";

export const DEFAULT_VIBE = "stealth";

export type PaletteRole = "primary" | "secondary" | "accent" | "soft" | "contrast";

export interface Vibe {
  readonly id: string;
  readonly label: string;
  readonly background: {
    readonly from: string;
    readonly to: string;
    readonly angle: number;
  };
  readonly foreground: string;
  readonly palette: Record<PaletteRole, string>;
}

const LIGHT_MARK = "#18181b";
const DARK_MARK = "#f8fafc";

function markPalette(color: string): Record<PaletteRole, string> {
  return {
    primary: color,
    secondary: color,
    accent: color,
    soft: color,
    contrast: color,
  };
}

export const VIBES = {
  daybreak: {
    id: "daybreak",
    label: "Daybreak",
    background: { from: "#fff7df", to: "#ffd8a8", angle: 135 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    background: { from: "#ffe4e6", to: "#ffc7a5", angle: 145 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    background: { from: "#dff7ff", to: "#a8dcf4", angle: 120 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  forest: {
    id: "forest",
    label: "Forest",
    background: { from: "#e9f8df", to: "#bdecc9", angle: 125 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  fire: {
    id: "fire",
    label: "Fire",
    background: { from: "#ffe8cc", to: "#ffc2a0", angle: 140 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  crystal: {
    id: "crystal",
    label: "Crystal",
    background: { from: "#f4efff", to: "#d9c8ff", angle: 130 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  ice: {
    id: "ice",
    label: "Ice",
    background: { from: "#eefcff", to: "#cbeafe", angle: 135 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
  stealth: {
    id: "stealth",
    label: "Stealth",
    background: { from: "#030712", to: "#374151", angle: 125 },
    foreground: DARK_MARK,
    palette: markPalette(DARK_MARK),
  },
  bubble: {
    id: "bubble",
    label: "Bubble",
    background: { from: "#fdf2f8", to: "#d8e7ff", angle: 135 },
    foreground: LIGHT_MARK,
    palette: markPalette(LIGHT_MARK),
  },
} as const satisfies Record<string, Vibe>;

export type VibeId = keyof typeof VIBES;

export const SUPPORTED_VIBES = Object.keys(VIBES) as VibeId[];

export function resolveVibe(vibe: string | null | undefined): Result<Vibe> {
  const id = (vibe?.trim().toLowerCase() || DEFAULT_VIBE) as VibeId;
  const resolved = VIBES[id];

  if (resolved) {
    return { ok: true, value: resolved };
  }

  return {
    ok: false,
    error: invalidVibe(id),
  };
}

function invalidVibe(value: string): AvatarError {
  return {
    code: "invalid_vibe",
    message: `Unsupported avatar vibe: ${value}`,
    value,
    supported: SUPPORTED_VIBES,
  };
}
