export type MaskTool = "move" | "erase" | "restore";
export type MaskPoint = { x: number; y: number };
export type MaskPatch = { image: ImageData; x: number; y: number };

export function mapPreviewPointToSource(
  previewX: number,
  previewY: number,
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): MaskPoint {
  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight) * zoom;
  const drawX = (canvasWidth - sourceWidth * scale) / 2 + offsetX;
  const drawY = (canvasHeight - sourceHeight * scale) / 2 + offsetY;
  return { x: (previewX - drawX) / scale, y: (previewY - drawY) / scale };
}

export function paintMaskPoint(
  cutout: HTMLCanvasElement,
  original: HTMLImageElement,
  point: MaskPoint,
  radius: number,
  tool: Exclude<MaskTool, "move">,
): MaskPatch | undefined {
  const context = cutout.getContext("2d");
  if (!context) return;
  const x = Math.max(0, Math.floor(point.x - radius - 1));
  const y = Math.max(0, Math.floor(point.y - radius - 1));
  const right = Math.min(cutout.width, Math.ceil(point.x + radius + 1));
  const bottom = Math.min(cutout.height, Math.ceil(point.y + radius + 1));
  if (right <= x || bottom <= y) return;
  const patch = { image: context.getImageData(x, y, right - x, bottom - y), x, y };

  context.save();
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.clip();
  if (tool === "erase") {
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "rgba(0, 0, 0, 1)";
    context.fillRect(x, y, right - x, bottom - y);
  } else {
    context.globalCompositeOperation = "source-over";
    context.drawImage(original, 0, 0, cutout.width, cutout.height);
  }
  context.restore();
  return patch;
}
