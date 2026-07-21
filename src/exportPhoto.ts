export function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("JPEG 编码失败")), "image/jpeg", quality);
  });
}

export async function encodeJpegToLimit(canvas: HTMLCanvasElement, maxBytes?: number): Promise<Blob> {
  if (!maxBytes) return canvasToJpeg(canvas, 0.92);
  let low = 0.42;
  let high = 0.96;
  let best = await canvasToJpeg(canvas, low);
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const quality = (low + high) / 2;
    const candidate = await canvasToJpeg(canvas, quality);
    if (candidate.size <= maxBytes) { best = candidate; low = quality; } else { high = quality; }
  }
  return best;
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
