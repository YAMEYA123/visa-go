import { describe, expect, it } from "vitest";
import { getQualityChecks } from "./quality";

describe("getQualityChecks", () => {
  it("passes a normally exposed sharp single-person photo", () => {
    const checks = getQualityChecks({ brightness: 128, darkRatio: 0.03, brightRatio: 0.04, sharpness: 240 }, 1, 2);
    expect(checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("warns for dark and blurry photos", () => {
    const checks = getQualityChecks({ brightness: 42, darkRatio: 0.4, brightRatio: 0, sharpness: 12 }, 1, 0);
    expect(checks.filter((check) => check.status === "warning").map((check) => check.label)).toEqual(["整体亮度", "曝光分布", "照片清晰度"]);
  });

  it("warns for multiple faces and head tilt", () => {
    const multiple = getQualityChecks({ brightness: 128, darkRatio: 0, brightRatio: 0, sharpness: 120 }, 2);
    expect(multiple.find((check) => check.label === "人脸数量")?.status).toBe("warning");
    const tilted = getQualityChecks({ brightness: 128, darkRatio: 0, brightRatio: 0, sharpness: 120 }, 1, 8);
    expect(tilted.find((check) => check.label === "头部水平")?.status).toBe("warning");
  });
});
