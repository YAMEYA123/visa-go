import { describe, expect, it } from "vitest";
import { getComplianceChecks } from "./compliance";
import { photoSpecs } from "./specs";

describe("compliance checks", () => {
  it("warns when an exported file is below the minimum", () => {
    const uk = photoSpecs.find((spec) => spec.id === "gb-visa-digital")!;
    expect(getComplianceChecks(uk, 20_000).find((check) => check.label === "文件大小")?.status).toBe("warning");
  });
  it("passes a file within its limits", () => {
    const us = photoSpecs.find((spec) => spec.id === "us-niv-digital")!;
    expect(getComplianceChecks(us, 200_000).find((check) => check.label === "文件大小")?.status).toBe("pass");
  });
});
