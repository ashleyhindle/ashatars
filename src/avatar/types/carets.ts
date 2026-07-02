import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape, Paint } from "../render";

export const CARETS_TYPE = "carets";

const CARET_COUNTS = [18, 21, 24, 28, 32, 36, 40, 45] as const;
const STROKE_ROLES = ["primary", "secondary", "accent", "contrast"] as const;

export function generateCarets(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(CARET_COUNTS);
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const xSpacing = ctx.size / (columns + 1);
  const ySpacing = ctx.size / (rows + 1);
  const baseSize = Math.min(xSpacing, ySpacing) * ctx.rng.float(0.23, 0.32);
  const baseStroke = Math.max(5, baseSize * ctx.rng.float(0.24, 0.34));
  const wobble = Math.min(xSpacing, ySpacing) * 0.045;
  const shadowShapes: AvatarShape[] = [];
  const markShapes: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cx = (column + 1) * xSpacing + ctx.rng.float(-wobble, wobble);
    const cy = (row + 1) * ySpacing + ctx.rng.float(-wobble, wobble);
    const size = baseSize * ctx.rng.float(0.9, 1.16);
    const halfWidth = size * ctx.rng.float(0.82, 1.08);
    const peakLift = size * ctx.rng.float(0.84, 1.1);
    const footDrop = size * ctx.rng.float(0.72, 0.98);
    const d = caretPath(cx, cy, halfWidth, peakLift, footDrop);
    const role = STROKE_ROLES[(index + ctx.rng.int(0, STROKE_ROLES.length - 1)) % STROKE_ROLES.length]!;

    shadowShapes.push(caretShape(d, { role: "soft" }, baseStroke * 1.55, 0.34));
    markShapes.push(caretShape(d, { role }, baseStroke, ctx.rng.float(0.76, 0.96)));
  }

  return {
    layers: [
      {
        id: "carets-shadow",
        shapes: shadowShapes,
      },
      {
        id: "carets-marks",
        shapes: markShapes,
      },
    ],
  };
}

function caretShape(d: string, stroke: Paint, strokeWidth: number, opacity: number): AvatarShape {
  return {
    kind: "path",
    d,
    fill: "none",
    stroke,
    strokeWidth,
    opacity,
  };
}

function caretPath(cx: number, cy: number, halfWidth: number, peakLift: number, footDrop: number): string {
  const leftX = cx - halfWidth;
  const rightX = cx + halfWidth;
  const footY = cy + footDrop;
  const peakY = cy - peakLift;

  return `M${round(leftX)},${round(footY)} L${round(cx)},${round(peakY)} L${round(rightX)},${round(footY)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
