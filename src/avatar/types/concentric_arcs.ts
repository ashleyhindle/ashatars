import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { fmt } from "./ref-geometry";

export const CONCENTRIC_ARCS_TYPE = "concentric_arcs";

const ARC_COUNTS = [2, 3, 4] as const;

export function generateConcentricArcs(ctx: AvatarContext): AvatarArtwork {
  const count = ctx.rng.pick(ARC_COUNTS);
  const center = ctx.size / 2;
  const maxRadius = 240;
  const minGap = 5;
  const shapes: AvatarShape[] = [];

  for (let index = 1; index <= count; index += 1) {
    const radius = maxRadius * (index / count) - (index - 1) * minGap;
    const startAngle = ctx.rng.next() * Math.PI * 2;
    const arcLength = (ctx.rng.next() * 0.5 + 0.25) * Math.PI * 2;
    const endAngle = startAngle + arcLength;
    const start = pointOnCircle(center, radius, startAngle);
    const end = pointOnCircle(center, radius, endAngle);

    shapes.push({
      kind: "path",
      d: `M${fmt(start.x)},${fmt(start.y)} A${fmt(radius)},${fmt(radius)} 0 ${arcLength > Math.PI ? 1 : 0},1 ${fmt(end.x)},${fmt(end.y)}`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(8, 16),
    });
  }

  return {
    layers: [
      {
        id: "concentric_arcs",
        shapes,
      },
    ],
  };
}

function pointOnCircle(center: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}
