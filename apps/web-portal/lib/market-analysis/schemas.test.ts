import { describe, expect, it } from "vitest";
import {
  defaultSegmentFilters,
  defaultWhatIfValues,
  segmentFilterSchema,
  whatIfSchema
} from "./schemas";

describe("market analysis schemas", () => {
  it("accepts the default what-if values", () => {
    expect(whatIfSchema.parse(defaultWhatIfValues)).toEqual(defaultWhatIfValues);
  });

  it("rejects invalid what-if values with field-specific errors", () => {
    const result = whatIfSchema.safeParse({
      square_footage: 0,
      bedrooms: -1,
      bathrooms: -1,
      year_built: 1700,
      lot_size: 0,
      distance_to_city_center: -0.5,
      school_rating: 11
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.square_footage).toContain(
        "Square footage must be greater than 0"
      );
      expect(result.error.flatten().fieldErrors.school_rating).toContain(
        "School rating must be at most 10"
      );
    }
  });

  it("accepts empty segment filters", () => {
    expect(segmentFilterSchema.parse(defaultSegmentFilters)).toEqual(defaultSegmentFilters);
  });

  it("rejects segment ranges where minimum is greater than maximum", () => {
    const result = segmentFilterSchema.safeParse({
      minPrice: 500000,
      maxPrice: 250000,
      minBedrooms: 4,
      maxBedrooms: 2,
      minSchoolRating: 7,
      maxDistanceToCityCenter: 5
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.maxPrice).toContain("Maximum price must be greater than or equal to minimum price");
      expect(errors.maxBedrooms).toContain("Maximum bedrooms must be greater than or equal to minimum bedrooms");
    }
  });

  it("coerces string form values into numbers", () => {
    expect(
      whatIfSchema.parse({
        square_footage: "1550",
        bedrooms: "3",
        bathrooms: "2",
        year_built: "1997",
        lot_size: "6800",
        distance_to_city_center: "4.1",
        school_rating: "7.6"
      })
    ).toEqual(defaultWhatIfValues);
  });
});
