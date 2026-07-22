import type { FaceBounds } from "./vision";

export function calculateFaceOffset(
  face: FaceBounds,
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cover = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const drawnWidth = sourceWidth * cover;
  const drawnHeight = sourceHeight * cover;
  const faceCenterX = ((face.left + face.right) / 2) * sourceWidth;
  const faceCenterY = ((face.top + face.bottom) / 2) * sourceHeight;
  return {
    x: drawnWidth / 2 - faceCenterX * cover,
    y: canvasHeight * 0.43 - ((canvasHeight - drawnHeight) / 2 + faceCenterY * cover),
  };
}
