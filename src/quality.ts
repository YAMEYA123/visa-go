import type { Check } from "./compliance";

export type QualityMetrics = {
  brightness: number;
  darkRatio: number;
  brightRatio: number;
  sharpness: number;
};

export function inspectImageQuality(image: HTMLImageElement): QualityMetrics {
  const scale = Math.min(1, 192 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(3, Math.round(image.naturalWidth * scale));
  const height = Math.max(3, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("无法读取照片像素");
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  let brightness = 0;
  let dark = 0;
  let bright = 0;
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    const value = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
    gray[index] = value;
    brightness += value;
    if (value < 35) dark += 1;
    if (value > 235) bright += 1;
  }
  let laplacian = 0;
  let laplacianSquared = 0;
  let samples = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const value = 4 * gray[index] - gray[index - 1] - gray[index + 1] - gray[index - width] - gray[index + width];
      laplacian += value;
      laplacianSquared += value * value;
      samples += 1;
    }
  }
  const mean = samples ? laplacian / samples : 0;
  return {
    brightness: brightness / gray.length,
    darkRatio: dark / gray.length,
    brightRatio: bright / gray.length,
    sharpness: samples ? laplacianSquared / samples - mean * mean : 0,
  };
}

export function getQualityChecks(metrics: QualityMetrics, faceCount?: number, rollDegrees?: number): Check[] {
  const exposureWarning = metrics.darkRatio > 0.25 || metrics.brightRatio > 0.25;
  const brightnessWarning = metrics.brightness < 55 || metrics.brightness > 210;
  const checks: Check[] = [
    {
      label: "整体亮度",
      detail: brightnessWarning ? "画面可能过暗或过亮，建议在均匀自然光下重拍" : "整体亮度处于常见证件照范围",
      status: brightnessWarning ? "warning" : "pass",
    },
    {
      label: "曝光分布",
      detail: exposureWarning ? "阴影或高光区域较多，请检查面部是否清晰可见" : "未发现大面积纯黑或过曝区域",
      status: exposureWarning ? "warning" : "pass",
    },
    {
      label: "照片清晰度",
      detail: metrics.sharpness < 80 ? "照片可能模糊，建议使用对焦清晰的原图" : "边缘清晰度通过基础检测",
      status: metrics.sharpness < 80 ? "warning" : "pass",
    },
  ];
  if (faceCount === undefined) {
    checks.push({ label: "人脸数量", detail: "智能检测不可用，请人工确认只有一人", status: "warning" });
  } else if (faceCount !== 1) {
    checks.push({ label: "人脸数量", detail: faceCount === 0 ? "未检测到人脸，请使用清晰正面照" : `检测到 ${faceCount} 张人脸，证件照应只有一人`, status: "warning" });
  } else {
    checks.push({ label: "人脸数量", detail: "检测到一张人脸", status: "pass" });
  }
  if (faceCount === 1 && rollDegrees !== undefined) {
    const tilted = Math.abs(rollDegrees) > 5;
    checks.push({
      label: "头部水平",
      detail: tilted ? `眼睛连线倾斜约 ${Math.abs(rollDegrees).toFixed(1)}°，建议摆正头部` : "眼睛连线基本水平",
      status: tilted ? "warning" : "pass",
    });
  }
  return checks;
}
