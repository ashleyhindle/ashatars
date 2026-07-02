import type { AvatarContext } from "../core";
import type { AvatarArtwork, AvatarShape } from "../render";
import { circlePath } from "./ref-geometry";

export const BLOB_FACE_TYPE = "blob_face";

export function generateBlobFace(ctx: AvatarContext): AvatarArtwork {
  const hair = sunriseHair(ctx);
  const eye1X = ctx.rng.int(100, 280);
  const eyeY = ctx.rng.int(190, 240);
  const eye2X = eye1X + ctx.rng.int(100, 170);
  const eyeRadius = ctx.rng.int(3, 20);
  const smileStartX = eye1X;
  const smileY = eyeY + ctx.rng.int(140, 180);
  const smileEndX = smileStartX + ctx.rng.int(40, 230);
  const smileControlX = smileStartX + (smileEndX - smileStartX) / 2;
  const smileControlY = smileY + ctx.rng.int(40, 70);
  const features: AvatarShape[] = [
    {
      kind: "path",
      id: "left-eye",
      d: circlePath(eye1X, eyeY, eyeRadius),
      fill: { role: "primary" },
    },
    {
      kind: "path",
      id: "right-eye",
      d: circlePath(eye2X, eyeY, eyeRadius),
      fill: { role: "primary" },
    },
    {
      kind: "path",
      id: "smile",
      d: `M${smileStartX},${smileY} Q${smileControlX},${smileControlY} ${smileEndX},${smileY}`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(8, 16),
    },
  ];

  return {
    layers: [
      {
        id: "blob-face-hair",
        shapes: hair,
      },
      {
        id: "blob-face-features",
        shapes: features,
      },
    ],
  };
}

function sunriseHair(ctx: AvatarContext): AvatarShape[] {
  let currentY = ctx.rng.int(2, 50);
  const shapes: AvatarShape[] = [];

  for (let index = 0; index < 2; index += 1) {
    shapes.push({
      kind: "path",
      d: `M0,${currentY} H512`,
      fill: "none",
      stroke: { role: "primary" },
      strokeWidth: ctx.rng.int(8, 16),
    });
    currentY = Math.min(currentY + ctx.rng.int(31, 170), 180);
  }

  return shapes;
}
