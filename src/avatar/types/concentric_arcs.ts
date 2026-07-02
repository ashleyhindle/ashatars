import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";

export const CONCENTRIC_ARCS_TYPE = "concentric_arcs";

const ROLES = ["primary", "secondary", "accent", "soft", "contrast"] as const;

export function generateConcentricArcs(ctx: AvatarContext): AvatarArtwork {
  const center = ctx.size / 2;
  const count = ctx.rng.int(12, 18);
  const outerRadius = ctx.size * 0.43;
  const innerRadius = ctx.size * 0.12;
  const radiusStep = (outerRadius - innerRadius) / Math.max(1, count - 1);
  const rotation = ctx.rng.float(0, Math.PI * 2);
  const paths: AvatarShape[] = [];
  const anchors: AvatarShape[] = [];

  for (let index = 0; index < count; index += 1) {
    const radius = innerRadius + radiusStep * index + ctx.rng.float(-1.8, 1.8);
    const strokeWidth = Math.max(4, Math.min(radiusStep * 0.52, ctx.rng.float(6, 13)));
    const startAngle = rotation + index * 0.47 + ctx.rng.float(-0.32, 0.32);
    const arcLength = ctx.rng.float(Math.PI * 0.58, Math.PI * 1.55);
    const endAngle = startAngle + arcLength;
    const role = ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]!;
    const start = pointOnCircle(center, center, radius, startAngle);
    const end = pointOnCircle(center, center, radius, endAngle);

    paths.push({
      kind: "path",
      d: [
        `M${formatPathNumber(start.x)},${formatPathNumber(start.y)}`,
        `A${formatPathNumber(radius)},${formatPathNumber(radius)} 0 ${arcLength > Math.PI ? 1 : 0},1 ${formatPathNumber(end.x)},${formatPathNumber(end.y)}`,
      ].join(" "),
      fill: "none",
      stroke: { role },
      strokeWidth,
      opacity: ctx.rng.float(0.68, 0.95),
    });

    if (index % 3 === 0) {
      anchors.push({
        kind: "circle",
        cx: end.x,
        cy: end.y,
        r: strokeWidth * ctx.rng.float(0.34, 0.48),
        fill: { role: ROLES[(index + 2) % ROLES.length]! },
        opacity: ctx.rng.float(0.58, 0.82),
      });
    }
  }

  return {
    layers: [
      {
        id: "concentric-arcs-underlay",
        opacity: 0.28,
        shapes: paths.map((shape, index) => ({
          ...shape,
          id: `arc-glow-${index}`,
          stroke: { role: "soft" },
          strokeWidth: (shape.strokeWidth ?? 1) + 8,
          opacity: 0.32,
        })),
      },
      {
        id: "concentric-arcs",
        shapes: paths.map((shape, index) => ({
          ...shape,
          id: `arc-${index}`,
        })),
      },
      {
        id: "concentric-arc-anchors",
        shapes: anchors,
      },
    ],
  };
}

function pointOnCircle(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function formatPathNumber(value: number): string {
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
