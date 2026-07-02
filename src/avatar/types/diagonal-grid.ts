import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import type { PaletteRole } from "../vibes";

export const DIAGONAL_GRID_TYPE = "diagonal_grid";

type GridLine = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
};

const GRID_ROLES = ["primary", "secondary", "accent", "contrast"] as const satisfies readonly PaletteRole[];

export function generateDiagonalGrid(ctx: AvatarContext): AvatarArtwork {
  const angle = ctx.rng.float(24, 68) * (ctx.rng.next() < 0.5 ? -1 : 1);
  const horizontalCount = ctx.rng.int(4, 6);
  const verticalCount = ctx.rng.int(4, 6);
  const margin = ctx.size * 0.18;
  const jitter = ctx.size * 0.035;
  const horizontalLines = makeAxisLines(ctx, "horizontal", horizontalCount, margin, jitter);
  const verticalLines = makeAxisLines(ctx, "vertical", verticalCount, margin, jitter);
  const hairlineWidth = ctx.rng.float(2.2, 4.8);
  const emphasisEvery = ctx.rng.int(2, 3);
  const rotated = [...horizontalLines, ...verticalLines].map((line) =>
    rotateLine(line, angle, ctx.size / 2),
  );

  return {
    layers: [
      {
        id: "diagonal_grid-soft",
        opacity: 0.42,
        shapes: rotated.map((line): AvatarShape => ({
          kind: "path",
          d: linePath(line),
          fill: "none",
          stroke: { role: "soft" },
          strokeWidth: hairlineWidth + 7,
          opacity: ctx.rng.float(0.22, 0.42),
        })),
      },
      {
        id: "diagonal_grid-lines",
        shapes: rotated.map((line, index): AvatarShape => ({
          kind: "path",
          d: linePath(line),
          fill: "none",
          stroke: {
            role: index % emphasisEvery === 0 ? "accent" : GRID_ROLES[index % GRID_ROLES.length]!,
          },
          strokeWidth: index % emphasisEvery === 0 ? hairlineWidth + 1.6 : hairlineWidth,
          opacity: ctx.rng.float(0.6, 0.9),
        })),
      },
    ],
  };
}

function makeAxisLines(
  ctx: AvatarContext,
  axis: "horizontal" | "vertical",
  count: number,
  margin: number,
  jitter: number,
): GridLine[] {
  const extent = ctx.size + margin * 2;
  const spacing = extent / (count + 1);

  return Array.from({ length: count }, (_, index) => {
    const position = -margin + spacing * (index + 1) + ctx.rng.float(-jitter, jitter);

    if (axis === "horizontal") {
      const y = position;
      return {
        x1: -margin,
        y1: y,
        x2: ctx.size + margin,
        y2: y + ctx.rng.float(-jitter, jitter) * 0.3,
      };
    }

    const x = position;
    return {
      x1: x,
      y1: -margin,
      x2: x + ctx.rng.float(-jitter, jitter) * 0.3,
      y2: ctx.size + margin,
    };
  });
}

function rotateLine(line: GridLine, angleDegrees: number, center: number): GridLine {
  const radians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const start = rotatePoint(line.x1, line.y1, center, cos, sin);
  const end = rotatePoint(line.x2, line.y2, center, cos, sin);

  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  };
}

function rotatePoint(
  x: number,
  y: number,
  center: number,
  cos: number,
  sin: number,
): { readonly x: number; readonly y: number } {
  const dx = x - center;
  const dy = y - center;

  return {
    x: center + dx * cos - dy * sin,
    y: center + dx * sin + dy * cos,
  };
}

function linePath(line: GridLine): string {
  return `M${formatPathNumber(line.x1)},${formatPathNumber(line.y1)} L${formatPathNumber(
    line.x2,
  )},${formatPathNumber(line.y2)}`;
}

function formatPathNumber(value: number): string {
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
