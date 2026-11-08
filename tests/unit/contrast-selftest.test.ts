import { describe, expect, it } from "vitest";
import { contrastRatio, luminance, parseHex } from "@/lib/utils/contrast";

/** The contrast checker itself must be right, or the token tests prove nothing. */
describe("contrast helper", () => {
  it("black on white is exactly 21:1 and is symmetric", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });
  it("identical colours are 1:1", () => {
    expect(contrastRatio("#8b9dff", "#8b9dff")).toBeCloseTo(1, 5);
  });
  it("matches the published WCAG example: #767676 on white is 4.54:1", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
  it("luminance of pure channels follows the WCAG coefficients", () => {
    expect(luminance("#ff0000")).toBeCloseTo(0.2126, 4);
    expect(luminance("#00ff00")).toBeCloseTo(0.7152, 4);
    expect(luminance("#0000ff")).toBeCloseTo(0.0722, 4);
  });
  it("rejects anything that is not #rrggbb", () => {
    for (const bad of ["red", "#fff", "#12345g", "123456", ""])
      expect(() => parseHex(bad)).toThrow();
  });
});
