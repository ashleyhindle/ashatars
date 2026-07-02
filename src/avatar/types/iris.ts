import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape, Paint } from "../render";

export const IRIS_TYPE = "iris";

const CENTER = 256;
const OUTER_RADIUS = 244;
const ROLES = ["primary", "secondary", "accent", "soft"] as const;

export function generateIris(ctx: AvatarContext): AvatarArtwork {
  const petalCount = ctx.rng.int(7, 12);
  const innerRadius = ctx.rng.int(72, 134);
  const step = (Math.PI * 2) / petalCount;
  const rotation = ctx.rng.float(-Math.PI, Math.PI);
  const bladeTwist = ctx.rng.float(0.28, 0.48);
  const seamInset = ctx.rng.float(0.016, 0.042);
  const petalShapes: AvatarShape[] = [];
  const seamShapes: AvatarShape[] = [];

  for (let index = 0; index < petalCount; index += 1) {
    const startAngle = rotation + index * step + seamInset;
    const endAngle = rotation + (index + 1) * step - seamInset;
    const innerStartAngle = startAngle + step * bladeTwist;
    const innerEndAngle = endAngle + step * bladeTwist;
    const role = ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]!;

    petalShapes.push({
      kind: "path",
      id: `iris-petal-${index + 1}`,
      d: petalPath(startAngle, endAngle, innerStartAngle, innerEndAngle, innerRadius),
      fill: { role },
      stroke: { role: "contrast" },
      strokeWidth: 2.4,
      opacity: ctx.rng.float(0.78, 0.95),
    });

    seamShapes.push({
      kind: "path",
      id: `iris-seam-${index + 1}`,
      d: radialPath(innerEndAngle, innerRadius * 0.94, OUTER_RADIUS * 0.92),
      fill: "none",
      stroke: { role: index % 2 === 0 ? "contrast" : "soft" },
      strokeWidth: ctx.rng.float(1.6, 3.2),
      opacity: ctx.rng.float(0.2, 0.42),
    });
  }

  return {
    layers: [
      {
        id: "iris-housing",
        shapes: [
          ringPath(OUTER_RADIUS, OUTER_RADIUS - 16, { role: "contrast" }, 0.28),
          circlePath(OUTER_RADIUS - 24, { role: "soft" }, 0.34),
        ],
      },
      {
        id: "iris-petals",
        shapes: petalShapes,
      },
      {
        id: "iris-seams",
        shapes: seamShapes,
      },
      {
        id: "iris-aperture",
        shapes: [
          circlePath(innerRadius * 0.88, { role: "contrast" }, 0.9),
          {
            kind: "path",
            id: "iris-aperture-rim",
            d: circleD(innerRadius * 0.98),
            fill: "none",
            stroke: { role: "accent" },
            strokeWidth: 5,
            opacity: 0.72,
          },
        ],
      },
    ],
  };
}

function petalPath(
  startAngle: number,
  endAngle: number,
  innerStartAngle: number,
  innerEndAngle: number,
  innerRadius: number,
): string {
  const outerStart = polar(OUTER_RADIUS, startAngle);
  const outerEnd = polar(OUTER_RADIUS, endAngle);
  const innerEnd = polar(innerRadius, innerEndAngle);
  const innerStart = polar(innerRadius, innerStartAngle);

  return [
    `M${fmt(outerStart.x)},${fmt(outerStart.y)}`,
    `A${OUTER_RADIUS},${OUTER_RADIUS} 0 0,1 ${fmt(outerEnd.x)},${fmt(outerEnd.y)}`,
    `L${fmt(innerEnd.x)},${fmt(innerEnd.y)}`,
    `A${innerRadius},${innerRadius} 0 0,0 ${fmt(innerStart.x)},${fmt(innerStart.y)}`,
    "Z",
  ].join(" ");
}

function radialPath(angle: number, innerRadius: number, outerRadius: number): string {
  const inner = polar(innerRadius, angle);
  const outer = polar(outerRadius, angle);

  return `M${fmt(inner.x)},${fmt(inner.y)} L${fmt(outer.x)},${fmt(outer.y)}`;
}

function ringPath(outerRadius: number, innerRadius: number, fill: Paint, opacity: number): AvatarShape {
  return {
    kind: "path",
    id: "iris-outer-ring",
    d: `${circleD(outerRadius)} ${circleD(innerRadius)}`,
    fill,
    opacity,
  };
}

function circlePath(radius: number, fill: Paint, opacity: number): AvatarShape {
  return {
    kind: "path",
    id: `iris-disc-${Math.round(radius)}`,
    d: circleD(radius),
    fill,
    opacity,
  };
}

function circleD(radius: number): string {
  const topY = CENTER - radius;
  const bottomY = CENTER + radius;

  return [
    `M${CENTER},${fmt(topY)}`,
    `A${fmt(radius)},${fmt(radius)} 0 1,1 ${CENTER},${fmt(bottomY)}`,
    `A${fmt(radius)},${fmt(radius)} 0 1,1 ${CENTER},${fmt(topY)}`,
    "Z",
  ].join(" ");
}

function polar(radius: number, angle: number): { x: number; y: number } {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function fmt(value: number): string {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
