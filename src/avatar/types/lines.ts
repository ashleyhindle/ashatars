import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape, PathShape } from "../render";

export const LINES_TYPE = "lines";

const ROLES = ["primary", "secondary", "accent", "contrast"] as const;

type Point = {
  readonly x: number;
  readonly y: number;
};

export function generateLines(ctx: AvatarContext): AvatarArtwork {
  const sides = ctx.rng.int(5, 10);
  const center = {
    x: ctx.size / 2 + ctx.rng.float(-18, 18),
    y: ctx.size / 2 + ctx.rng.float(-18, 18),
  };
  const radiusX = ctx.rng.float(178, 232);
  const radiusY = ctx.rng.float(178, 232);
  const rotation = ctx.rng.float(-Math.PI, Math.PI);
  const points = polygonPoints(ctx, sides, center, radiusX, radiusY, rotation);
  const innerPoints = points.map((point) => ({
    x: center.x + (point.x - center.x) * ctx.rng.float(0.36, 0.58),
    y: center.y + (point.y - center.y) * ctx.rng.float(0.36, 0.58),
  }));
  const shapes: AvatarShape[] = [
    {
      kind: "path",
      d: closedPath(points),
      fill: { role: "soft" },
      stroke: { role: "contrast" },
      strokeWidth: ctx.rng.int(5, 9),
      opacity: 0.72,
    },
    {
      kind: "path",
      d: openPath(interleave(points, innerPoints)),
      fill: "none",
      stroke: { role: ctx.rng.pick(ROLES) },
      strokeWidth: ctx.rng.int(3, 6),
      opacity: 0.88,
    },
    {
      kind: "path",
      d: closedPath(innerPoints),
      fill: "none",
      stroke: { role: "accent" },
      strokeWidth: ctx.rng.int(4, 7),
      opacity: 0.86,
    },
  ];

  for (let index = 0; index < sides; index += 1) {
    const nextIndex = (index + ctx.rng.int(2, Math.max(2, sides - 2))) % sides;
    shapes.push({
      kind: "path",
      d: openPath([points[index]!, innerPoints[nextIndex]!]),
      fill: "none",
      stroke: { role: ROLES[(index + ctx.rng.int(0, ROLES.length - 1)) % ROLES.length]! },
      strokeWidth: ctx.rng.int(2, 5),
      opacity: ctx.rng.float(0.42, 0.72),
    });
  }

  return {
    layers: [
      {
        id: "lines",
        shapes,
      },
    ],
  };
}

function polygonPoints(
  ctx: AvatarContext,
  sides: number,
  center: Point,
  radiusX: number,
  radiusY: number,
  rotation: number,
): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const baseAngle = rotation + (index / sides) * Math.PI * 2;
    const angle = baseAngle + ctx.rng.float(-0.18, 0.18);
    const radiusScale = ctx.rng.float(0.76, 1);

    return {
      x: center.x + Math.cos(angle) * radiusX * radiusScale,
      y: center.y + Math.sin(angle) * radiusY * radiusScale,
    };
  });
}

function interleave(outer: readonly Point[], inner: readonly Point[]): Point[] {
  const points: Point[] = [];

  for (let index = 0; index < outer.length; index += 1) {
    points.push(outer[index]!, inner[index]!);
  }

  return points;
}

function openPath(points: readonly Point[]): string {
  return path(points, false);
}

function closedPath(points: readonly Point[]): string {
  return path(points, true);
}

function path(points: readonly Point[], closed: boolean): PathShape["d"] {
  if (points.length === 0) {
    throw new Error("Cannot create a line path without points.");
  }

  const [first, ...rest] = points.map(formatPoint) as [string, ...string[]];
  return `M${first} ${rest.map((point) => `L${point}`).join(" ")}${closed ? " Z" : ""}`;
}

function formatPoint(point: Point): string {
  return `${formatCoordinate(point.x)},${formatCoordinate(point.y)}`;
}

function formatCoordinate(value: number): string {
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
