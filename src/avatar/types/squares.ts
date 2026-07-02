import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import type { PaletteRole } from "../vibes";

export const SQUARES_TYPE = "squares";

const SQUARE_COUNTS = [4, 5, 6, 7, 8, 9] as const;
const FILL_ROLES = ["soft", "primary", "secondary", "accent"] as const satisfies readonly PaletteRole[];
const STROKE_ROLES = ["contrast", "primary", "accent"] as const satisfies readonly PaletteRole[];

interface SquareSpec {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
  readonly fillRole: PaletteRole;
  readonly strokeRole: PaletteRole;
  readonly strokeWidth: number;
}

export function generateSquares(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(SQUARE_COUNTS);
  const specs: SquareSpec[] = [];

  for (let index = 0; index < count; index += 1) {
    const size = ctx.rng.int(56, 238);
    const max = ctx.size - size - 32;
    const x = ctx.rng.int(32, Math.max(32, max));
    const y = ctx.rng.int(32, Math.max(32, max));

    specs.push({
      x,
      y,
      size,
      opacity: ctx.rng.float(0.28, 0.74),
      fillRole: FILL_ROLES[(index + ctx.rng.int(0, FILL_ROLES.length - 1)) % FILL_ROLES.length]!,
      strokeRole: STROKE_ROLES[(index + ctx.rng.int(0, STROKE_ROLES.length - 1)) % STROKE_ROLES.length]!,
      strokeWidth: ctx.rng.int(4, 12),
    });
  }

  const ordered = [...specs].sort((a, b) => b.size - a.size);
  const fills: AvatarShape[] = ordered.map((square) => ({
    kind: "rect",
    x: square.x,
    y: square.y,
    width: square.size,
    height: square.size,
    fill: { role: square.fillRole },
    opacity: square.opacity,
  }));
  const outlines: AvatarShape[] = ordered.map((square) => ({
    kind: "path",
    d: `M${square.x},${square.y} h${square.size} v${square.size} h-${square.size} z`,
    fill: "none",
    stroke: { role: square.strokeRole },
    strokeWidth: square.strokeWidth,
    opacity: 0.82,
  }));

  return {
    layers: [
      {
        id: "squares-fill",
        shapes: fills,
      },
      {
        id: "squares-outline",
        shapes: outlines,
      },
    ],
  };
}
