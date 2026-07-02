import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { fmt } from "./ref-geometry";

export const IRIS_TYPE = "iris";

const PETAL_COUNTS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const CENTER = 256;
const OUTER_RADIUS = 240;

export function generateIris(ctx: AvatarContext): AvatarArtwork {
  const petalCount = ctx.rng.pick(PETAL_COUNTS);
  const innerRadius = ctx.rng.int(31, OUTER_RADIUS - 70);
  const petalWidth = (Math.PI * 2) / petalCount;
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < petalCount; index += 1) {
    const startAngle = index * petalWidth;
    const endAngle = (index + 1) * petalWidth;
    const outerStart = polar(OUTER_RADIUS, startAngle);
    const outerEnd = polar(OUTER_RADIUS, endAngle);
    const innerStart = polar(innerRadius, startAngle);
    const innerEnd = polar(innerRadius, endAngle);

    shapes.push({
      kind: "path",
      d: [
        `M${fmt(outerStart.x)},${fmt(outerStart.y)}`,
        `A${OUTER_RADIUS},${OUTER_RADIUS} 0 0,1 ${fmt(outerEnd.x)},${fmt(outerEnd.y)}`,
        `L${fmt(innerEnd.x)},${fmt(innerEnd.y)}`,
        `A${innerRadius},${innerRadius} 0 0,0 ${fmt(innerStart.x)},${fmt(innerStart.y)}`,
        "Z",
      ].join(" "),
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(4, 10),
    });
  }

  shapes.push({
    kind: "circle",
    cx: CENTER,
    cy: CENTER,
    r: innerRadius,
    fill: "none",
    stroke: { role: "primary" },
    strokeWidth: ctx.rng.int(4, 10),
  });

  return {
    layers: [
      {
        id: "iris",
        shapes,
      },
    ],
  };
}

function polar(radius: number, angle: number): { x: number; y: number } {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}
