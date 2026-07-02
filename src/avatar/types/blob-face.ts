import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape, PathShape } from "../render";

export const BLOB_FACE_TYPE = "blob_face";

const FEATURE_ROLES = ["primary", "secondary", "accent", "contrast"] as const;

export function generateBlobFace(ctx: AvatarContext): AvatarArtwork {
  const face = createFaceBlob(ctx);
  const hair = createHairPaths(ctx);
  const features = createFeatures(ctx);

  return {
    layers: [
      {
        id: "blob-face-base",
        shapes: [face],
      },
      {
        id: "blob-face-hair",
        opacity: 0.88,
        shapes: hair,
      },
      {
        id: "blob-face-features",
        shapes: features,
      },
    ],
  };
}

function createFaceBlob(ctx: AvatarContext): PathShape {
  const topX = 252 + ctx.rng.float(-24, 24);
  const topY = 86 + ctx.rng.float(-14, 14);
  const rightX = 412 + ctx.rng.float(-16, 14);
  const rightY = 248 + ctx.rng.float(-24, 24);
  const bottomX = 268 + ctx.rng.float(-28, 28);
  const bottomY = 430 + ctx.rng.float(-18, 12);
  const leftX = 92 + ctx.rng.float(-12, 16);
  const leftY = 278 + ctx.rng.float(-26, 24);

  const d = [
    `M${topX},${topY}`,
    `C${316 + ctx.rng.float(-16, 20)},${70 + ctx.rng.float(-8, 22)} ${388 + ctx.rng.float(-18, 18)},${118 + ctx.rng.float(-18, 22)} ${rightX},${rightY}`,
    `C${432 + ctx.rng.float(-18, 10)},${326 + ctx.rng.float(-20, 20)} ${364 + ctx.rng.float(-22, 24)},${424 + ctx.rng.float(-16, 16)} ${bottomX},${bottomY}`,
    `C${184 + ctx.rng.float(-24, 24)},${452 + ctx.rng.float(-16, 10)} ${82 + ctx.rng.float(-14, 20)},${388 + ctx.rng.float(-24, 22)} ${leftX},${leftY}`,
    `C${68 + ctx.rng.float(-8, 18)},${188 + ctx.rng.float(-18, 24)} ${140 + ctx.rng.float(-20, 22)},${94 + ctx.rng.float(-12, 22)} ${topX},${topY}`,
    "Z",
  ].join(" ");

  return {
    kind: "path",
    id: "face-blob",
    d,
    fill: { role: "soft" },
    stroke: { role: "primary" },
    strokeWidth: ctx.rng.int(7, 12),
    opacity: 0.94,
  };
}

function createHairPaths(ctx: AvatarContext): PathShape[] {
  const startY = ctx.rng.int(112, 142);
  const gap = ctx.rng.int(22, 34);
  const count = ctx.rng.int(2, 4);

  return Array.from({ length: count }, (_, index) => {
    const y = startY + gap * index + ctx.rng.float(-6, 7);
    const left = 100 + ctx.rng.float(-14, 18);
    const right = 410 + ctx.rng.float(-18, 14);
    const lift = ctx.rng.float(-24, 18);
    const d = [
      `M${left},${y}`,
      `C${178 + ctx.rng.float(-18, 22)},${y + lift} ${316 + ctx.rng.float(-24, 18)},${y - lift * 0.45} ${right},${y + ctx.rng.float(-8, 8)}`,
    ].join(" ");

    return {
      kind: "path",
      id: `hair-${index + 1}`,
      d,
      fill: "none",
      stroke: { role: FEATURE_ROLES[(index + 1) % FEATURE_ROLES.length]! },
      strokeWidth: ctx.rng.int(8, 15),
      opacity: 0.76 + index * 0.06,
    };
  });
}

function createFeatures(ctx: AvatarContext): AvatarShape[] {
  const eyeY = ctx.rng.int(210, 248);
  const eyeSpacing = ctx.rng.int(108, 156);
  const centerShift = ctx.rng.float(-16, 16);
  const eyeRadius = ctx.rng.int(13, 25);
  const leftEyeX = 256 + centerShift - eyeSpacing / 2;
  const rightEyeX = 256 + centerShift + eyeSpacing / 2;
  const smileY = eyeY + ctx.rng.int(118, 154);
  const smileStartX = leftEyeX - ctx.rng.int(8, 28);
  const smileEndX = rightEyeX + ctx.rng.int(10, 54);
  const smileControlX = (smileStartX + smileEndX) / 2 + ctx.rng.float(-18, 18);
  const smileControlY = smileY + ctx.rng.int(36, 66);
  const cheekY = eyeY + ctx.rng.int(64, 88);

  return [
    {
      kind: "circle",
      id: "left-eye",
      cx: leftEyeX,
      cy: eyeY,
      r: eyeRadius,
      fill: { role: "contrast" },
    },
    {
      kind: "circle",
      id: "right-eye",
      cx: rightEyeX,
      cy: eyeY,
      r: eyeRadius,
      fill: { role: "contrast" },
    },
    {
      kind: "circle",
      id: "left-eye-spark",
      cx: leftEyeX - eyeRadius * 0.28,
      cy: eyeY - eyeRadius * 0.3,
      r: Math.max(4, eyeRadius * 0.24),
      fill: { role: "accent" },
      opacity: 0.86,
    },
    {
      kind: "circle",
      id: "right-eye-spark",
      cx: rightEyeX - eyeRadius * 0.28,
      cy: eyeY - eyeRadius * 0.3,
      r: Math.max(4, eyeRadius * 0.24),
      fill: { role: "accent" },
      opacity: 0.86,
    },
    {
      kind: "circle",
      id: "left-cheek",
      cx: leftEyeX - ctx.rng.int(28, 44),
      cy: cheekY,
      r: ctx.rng.int(15, 25),
      fill: { role: "secondary" },
      opacity: 0.42,
    },
    {
      kind: "circle",
      id: "right-cheek",
      cx: rightEyeX + ctx.rng.int(28, 44),
      cy: cheekY,
      r: ctx.rng.int(15, 25),
      fill: { role: "secondary" },
      opacity: 0.42,
    },
    {
      kind: "path",
      id: "smile",
      d: `M${smileStartX},${smileY} Q${smileControlX},${smileControlY} ${smileEndX},${smileY}`,
      fill: "none",
      stroke: { role: "contrast" },
      strokeWidth: ctx.rng.int(9, 14),
    },
  ];
}
