import type { PhotoSpec } from "./types";

export const photoSpecs: PhotoSpec[] = [
  {
    id: "us-niv-digital",
    name: "非移民签证 · 数字照片",
    country: "美国",
    mode: "在线申请",
    widthPx: 600,
    heightPx: 600,
    maxBytes: 240 * 1024,
    headRatio: [0.5, 0.69],
    note: "白色或近白背景；头部占照片总高度 50%–69%。",
    verifiedAt: "2026-07-21",
    source: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html",
  },
  {
    id: "ca-trv-print",
    name: "临时居民签证 · 纸质照片",
    country: "加拿大",
    mode: "纸质递交",
    widthPx: 827,
    heightPx: 1063,
    widthMm: 35,
    heightMm: 45,
    headRatio: [31 / 45, 36 / 45],
    note: "至少 35 × 45 mm；下巴至头顶 31–36 mm。像素按 600 DPI 导出，仅供打印排版参考。",
    verifiedAt: "2026-07-21",
    source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/temporary-resident-visa-application-photograph-specifications.html",
  },
  {
    id: "gb-visa-digital",
    name: "签证申请 · 数字照片",
    country: "英国",
    mode: "在线申请",
    widthPx: 600,
    heightPx: 750,
    minBytes: 50 * 1024,
    maxBytes: 6 * 1024 * 1024,
    note: "至少 600 × 750 px，JPEG，50 KB–6 MB，竖向照片。",
    verifiedAt: "2026-07-21",
    source: "https://www.gov.uk/guidance/how-to-take-a-photo-for-a-visa-application-or-permission",
  },
];

export const pendingSpecs = [
  { country: "申根", detail: "需按受理国与递交渠道核验" },
  { country: "日本", detail: "需按签证类别与递交机构核验" },
];
