import type { PhotoSpec } from "./types";

export type Check = { label: string; detail: string; status: "pass" | "warning" };

export function getComplianceChecks(spec: PhotoSpec, fileSize?: number): Check[] {
  const checks: Check[] = [
    { label: "输出尺寸", detail: `${spec.widthPx} × ${spec.heightPx} px`, status: "pass" },
    { label: "文件格式", detail: "JPEG", status: "pass" },
  ];
  if (fileSize !== undefined) {
    const inRange = (!spec.minBytes || fileSize >= spec.minBytes) && (!spec.maxBytes || fileSize <= spec.maxBytes);
    checks.push({ label: "文件大小", detail: inRange ? "在模板范围内" : "未达到模板要求，请更换细节更丰富的原图", status: inRange ? "pass" : "warning" });
  }
  checks.push({ label: "人物构图", detail: spec.headRatio ? `请确认头顶至下巴占画面高度 ${Math.round(spec.headRatio[0] * 100)}%–${Math.round(spec.headRatio[1] * 100)}%` : "请按辅助线人工确认", status: "warning" });
  return checks;
}
