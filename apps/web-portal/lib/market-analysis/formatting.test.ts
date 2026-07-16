import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedCurrency,
  marketFieldLabels
} from "./formatting";

describe("market analysis formatting", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(250829.56)).toBe("$250,830");
  });

  it("formats signed currency differences", () => {
    expect(formatSignedCurrency(12345.4)).toBe("+$12,345");
    expect(formatSignedCurrency(-12345.4)).toBe("-$12,345");
  });

  it("formats compact numbers and percentages", () => {
    expect(formatNumber(1550.42)).toBe("1,550.4");
    expect(formatPercent(64.3)).toBe("64.3%");
  });

  it("exposes labels for Java API feature names", () => {
    expect(marketFieldLabels.square_footage).toBe("Square footage");
    expect(marketFieldLabels.distance_to_city_center).toBe("Distance to city center");
  });
});
