import { describe, expect, it } from "vitest";
import { clampZoom, zoomAroundPoint } from "./zoomGesture";

describe("zoom gestures", () => {
  it("limits zoom to the supported range", () => {
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(4)).toBe(3);
  });

  it("keeps a centered anchor stationary", () => {
    expect(zoomAroundPoint(1, 2, 12, -8, 300, 300, 600, 600)).toEqual({ zoom: 2, offsetX: 24, offsetY: -16 });
  });

  it("adjusts offsets around an off-center anchor", () => {
    expect(zoomAroundPoint(1, 2, 0, 0, 450, 300, 600, 600)).toEqual({ zoom: 2, offsetX: -150, offsetY: 0 });
  });
});
