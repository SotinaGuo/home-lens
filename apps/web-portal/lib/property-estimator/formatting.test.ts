import { describe, expect, it } from "vitest";
import { featureLabels, formatCurrency, formatNumber } from "./formatting";

describe("formatting helpers", () => {
  it("formats currency for predicted prices", () => {
    expect(formatCurrency(250829.56)).toBe("$250,829.56");
  });

  it("formats compact feature numbers", () => {
    expect(formatNumber(6800)).toBe("6,800");
  });

  it("exposes human-readable labels for all model fields", () => {
    expect(featureLabels.square_footage).toBe("Square footage");
    expect(featureLabels.distance_to_city_center).toBe("Distance to city center");
  });
});
