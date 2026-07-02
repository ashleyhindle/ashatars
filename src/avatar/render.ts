import type { AvatarContext } from "./core";
import type { PaletteRole, Vibe } from "./vibes";

export type Paint = { readonly role: PaletteRole } | "none";

export interface ShapeBase {
  readonly id?: string;
  readonly fill?: Paint;
  readonly stroke?: Paint;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export interface CircleShape extends ShapeBase {
  readonly kind: "circle";
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export interface RectShape extends ShapeBase {
  readonly kind: "rect";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx?: number;
}

export interface PathShape extends ShapeBase {
  readonly kind: "path";
  readonly d: string;
}

export type AvatarShape = CircleShape | RectShape | PathShape;

export interface AvatarLayer {
  readonly id: string;
  readonly opacity?: number;
  readonly shapes: readonly AvatarShape[];
}

export interface AvatarArtwork {
  readonly layers: readonly AvatarLayer[];
}

export function renderAvatarSvg(ctx: AvatarContext, vibe: Vibe, artwork: AvatarArtwork): string {
  validateArtwork(artwork);
  const gradient = gradientCoordinates(vibe.background.angle);
  const title = `Ashatar ${ctx.type} avatar`;
  const desc = `${vibe.label} deterministic SVG avatar`;
  const body = artwork.layers.map((layer) => renderLayer(layer, vibe)).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ctx.size}" height="${ctx.size}" viewBox="0 0 ${ctx.size} ${ctx.size}" role="img" aria-labelledby="title desc">`,
    "<defs>",
    `<linearGradient id="bg" x1="${formatNumber(gradient.x1)}" y1="${formatNumber(gradient.y1)}" x2="${formatNumber(gradient.x2)}" y2="${formatNumber(gradient.y2)}">`,
    `<stop offset="0" stop-color="${escapeAttribute(vibe.background.from)}"/>`,
    `<stop offset="1" stop-color="${escapeAttribute(vibe.background.to)}"/>`,
    "</linearGradient>",
    "</defs>",
    `<title id="title">${escapeText(title)}</title>`,
    `<desc id="desc">${escapeText(desc)}</desc>`,
    `<rect width="${ctx.size}" height="${ctx.size}" fill="url(#bg)"/>`,
    body,
    "</svg>",
  ].join("");
}

function renderLayer(layer: AvatarLayer, vibe: Vibe): string {
  const attrs = [
    ["id", layer.id],
    layer.opacity == null ? undefined : ["opacity", formatNumber(layer.opacity)],
  ]
    .filter(Boolean)
    .map((pair) => ` ${pair![0]}="${escapeAttribute(pair![1])}"`)
    .join("");

  return `<g${attrs}>${layer.shapes.map((shape) => renderShape(shape, vibe)).join("")}</g>`;
}

function renderShape(shape: AvatarShape, vibe: Vibe): string {
  const attrs = commonShapeAttributes(shape, vibe);

  switch (shape.kind) {
    case "circle":
      return `<circle cx="${formatNumber(shape.cx)}" cy="${formatNumber(shape.cy)}" r="${formatNumber(shape.r)}"${attrs}/>`;
    case "rect":
      return `<rect x="${formatNumber(shape.x)}" y="${formatNumber(shape.y)}" width="${formatNumber(shape.width)}" height="${formatNumber(shape.height)}"${shape.rx == null ? "" : ` rx="${formatNumber(shape.rx)}"`}${attrs}/>`;
    case "path":
      return `<path d="${escapeAttribute(shape.d)}"${attrs}/>`;
  }
}

function commonShapeAttributes(shape: AvatarShape, vibe: Vibe): string {
  const attrs: string[] = [];

  if (shape.id) {
    attrs.push(`id="${escapeAttribute(shape.id)}"`);
  }

  attrs.push(`fill="${paintValue(shape.fill ?? { role: "primary" }, vibe)}"`);

  if (shape.stroke) {
    attrs.push(`stroke="${paintValue(shape.stroke, vibe)}"`);
  }

  if (shape.strokeWidth != null) {
    attrs.push(`stroke-width="${formatNumber(shape.strokeWidth)}"`);
  }

  if (shape.opacity != null) {
    attrs.push(`opacity="${formatNumber(shape.opacity)}"`);
  }

  return attrs.length === 0 ? "" : ` ${attrs.join(" ")}`;
}

function paintValue(paint: Paint, vibe: Vibe): string {
  if (paint === "none") {
    return "none";
  }

  return escapeAttribute(vibe.foreground);
}

function validateArtwork(artwork: AvatarArtwork): void {
  for (const layer of artwork.layers) {
    validateId(layer.id);
    validateOpacity(layer.opacity);

    for (const shape of layer.shapes) {
      if (shape.id) {
        validateId(shape.id);
      }

      validatePaint(shape.fill);
      validatePaint(shape.stroke);
      validateOpacity(shape.opacity);
      validatePositive(shape.strokeWidth, "strokeWidth");

      switch (shape.kind) {
        case "circle":
          validateFinite(shape.cx, "cx");
          validateFinite(shape.cy, "cy");
          validatePositive(shape.r, "r");
          break;
        case "rect":
          validateFinite(shape.x, "x");
          validateFinite(shape.y, "y");
          validatePositive(shape.width, "width");
          validatePositive(shape.height, "height");
          validatePositive(shape.rx, "rx");
          break;
        case "path":
          if (!/^[MmZzLlHhVvCcSsQqTtAa0-9,.\-\s]+$/.test(shape.d)) {
            throw new Error("Invalid path data.");
          }
          break;
      }
    }
  }
}

function validateId(id: string): void {
  if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
    throw new Error(`Invalid SVG id: ${id}`);
  }
}

function validatePaint(paint: Paint | undefined): void {
  if (!paint || paint === "none") {
    return;
  }

  if (!["primary", "secondary", "accent", "soft", "contrast"].includes(paint.role)) {
    throw new Error(`Invalid paint role: ${paint.role}`);
  }
}

function validateOpacity(opacity: number | undefined): void {
  if (opacity == null) {
    return;
  }

  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new Error("Opacity must be between 0 and 1.");
  }
}

function validateFinite(value: number | undefined, name: string): void {
  if (value == null || !Number.isFinite(value)) {
    throw new Error(`${name} must be finite.`);
  }
}

function validatePositive(value: number | undefined, name: string): void {
  if (value == null) {
    return;
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive.`);
  }
}

function gradientCoordinates(angle: number): { x1: number; y1: number; x2: number; y2: number } {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) / 2;
  const y = Math.sin(radians) / 2;

  return {
    x1: 0.5 - x,
    y1: 0.5 - y,
    x2: 0.5 + x,
    y2: 0.5 + y,
  };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot format a non-finite number.");
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
