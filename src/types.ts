export type PhotoSpec = {
  id: string;
  name: string;
  country: string;
  mode: string;
  widthPx: number;
  heightPx: number;
  widthMm?: number;
  heightMm?: number;
  minBytes?: number;
  maxBytes?: number;
  headRatio?: [number, number];
  note: string;
  verifiedAt: string;
  source: string;
};
