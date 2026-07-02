import type { AvatarShape } from "../render";

export type Point = {
  readonly x: number;
  readonly y: number;
};

export function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function point(point: Point): string {
  return `${fmt(point.x)},${fmt(point.y)}`;
}

export function linePath(points: readonly Point[], closed = false): string {
  if (points.length === 0) {
    throw new Error("Cannot build an empty path.");
  }

  const [first, ...rest] = points;
  return `M${point(first!)} ${rest.map((item) => `L${point(item)}`).join(" ")}${closed ? " Z" : ""}`;
}

export function strokePath(d: string, strokeWidth: number, opacity?: number): AvatarShape {
  return {
    kind: "path",
    d,
    fill: "none",
    stroke: { role: "primary" },
    strokeWidth,
    opacity,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function circlePath(cx: number, cy: number, radius: number): string {
  const r = fmt(radius);
  return `M${fmt(cx)},${fmt(cy)} a${r},${r} 0 1,0 ${fmt(radius * 2)},0 a${r},${r} 0 1,0 -${fmt(radius * 2)},0`;
}
