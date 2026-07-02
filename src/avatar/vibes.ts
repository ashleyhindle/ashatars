import type { AvatarError, Result } from "./core";

export const DEFAULT_VIBE = "daybreak";

export type PaletteRole = "primary" | "secondary" | "accent" | "soft" | "contrast";

export interface Vibe {
  readonly id: string;
  readonly label: string;
  readonly background: {
    readonly from: string;
    readonly to: string;
    readonly angle: number;
  };
  readonly palette: Record<PaletteRole, string>;
}

export const VIBES = {
  daybreak: {
    id: "daybreak",
    label: "Daybreak",
    background: { from: "#fff7df", to: "#ffd1a1", angle: 135 },
    palette: {
      primary: "#c2410c",
      secondary: "#f97316",
      accent: "#0f766e",
      soft: "#fed7aa",
      contrast: "#1f2937",
    },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    background: { from: "#39113f", to: "#f97316", angle: 145 },
    palette: {
      primary: "#facc15",
      secondary: "#fb7185",
      accent: "#60a5fa",
      soft: "#fdba74",
      contrast: "#fff7ed",
    },
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    background: { from: "#042f2e", to: "#38bdf8", angle: 120 },
    palette: {
      primary: "#e0f2fe",
      secondary: "#2dd4bf",
      accent: "#facc15",
      soft: "#bae6fd",
      contrast: "#082f49",
    },
  },
  forest: {
    id: "forest",
    label: "Forest",
    background: { from: "#052e16", to: "#86efac", angle: 125 },
    palette: {
      primary: "#fef3c7",
      secondary: "#22c55e",
      accent: "#a16207",
      soft: "#bbf7d0",
      contrast: "#14532d",
    },
  },
  fire: {
    id: "fire",
    label: "Fire",
    background: { from: "#450a0a", to: "#f59e0b", angle: 140 },
    palette: {
      primary: "#fff7ed",
      secondary: "#ef4444",
      accent: "#fde047",
      soft: "#fed7aa",
      contrast: "#1c1917",
    },
  },
  crystal: {
    id: "crystal",
    label: "Crystal",
    background: { from: "#f8fafc", to: "#a78bfa", angle: 130 },
    palette: {
      primary: "#312e81",
      secondary: "#06b6d4",
      accent: "#f0abfc",
      soft: "#ddd6fe",
      contrast: "#020617",
    },
  },
  ice: {
    id: "ice",
    label: "Ice",
    background: { from: "#ecfeff", to: "#93c5fd", angle: 135 },
    palette: {
      primary: "#0f172a",
      secondary: "#0284c7",
      accent: "#67e8f9",
      soft: "#dbeafe",
      contrast: "#164e63",
    },
  },
  stealth: {
    id: "stealth",
    label: "Stealth",
    background: { from: "#030712", to: "#374151", angle: 125 },
    palette: {
      primary: "#e5e7eb",
      secondary: "#9ca3af",
      accent: "#22c55e",
      soft: "#4b5563",
      contrast: "#f9fafb",
    },
  },
  bubble: {
    id: "bubble",
    label: "Bubble",
    background: { from: "#fdf2f8", to: "#bfdbfe", angle: 135 },
    palette: {
      primary: "#be185d",
      secondary: "#7dd3fc",
      accent: "#a78bfa",
      soft: "#fbcfe8",
      contrast: "#1e1b4b",
    },
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
