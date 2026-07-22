import { describe, expect, it } from "vitest";
import { calculateFaceOffset } from "./autoCrop";

describe("automatic face positioning", () => {
  it("keeps a centered face horizontally centered", () => {
    const offset = calculateFaceOffset({ left: 0.4, right: 0.6, top: 0.2, bottom: 0.6 }, 1000, 1200, 600, 750);
    expect(offset.x).toBeCloseTo(0);
  });
});
