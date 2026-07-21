import { describe, expect, it } from "vitest";
import { photoSpecs } from "./specs";

describe("photo specifications", () => {
  it("keeps verified specifications internally consistent", () => {
    for (const spec of photoSpecs) {
      expect(spec.widthPx).toBeGreaterThan(0);
      expect(spec.heightPx).toBeGreaterThan(0);
      expect(spec.source.startsWith("https://")).toBe(true);
      if (spec.minBytes && spec.maxBytes) expect(spec.minBytes).toBeLessThan(spec.maxBytes);
      if (spec.headRatio) expect(spec.headRatio[0]).toBeLessThan(spec.headRatio[1]);
    }
  });

  it("uses unique stable identifiers", () => {
    expect(new Set(photoSpecs.map((spec) => spec.id)).size).toBe(photoSpecs.length);
  });
});
