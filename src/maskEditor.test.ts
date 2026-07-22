import { describe, expect, it } from "vitest";
import { mapPreviewPointToSource } from "./maskEditor";

describe("mask editor coordinates", () => {
  it("maps the preview centre to the source centre", () => {
    const point = mapPreviewPointToSource(300, 375, 1000, 1200, 600, 750, 1, 0, 0);
    expect(point.x).toBeCloseTo(500);
    expect(point.y).toBeCloseTo(600);
  });

  it("accounts for zoom and translation", () => {
    const point = mapPreviewPointToSource(320, 385, 1000, 1200, 600, 750, 2, 20, 10);
    expect(point.x).toBeCloseTo(500);
    expect(point.y).toBeCloseTo(600);
  });
});
