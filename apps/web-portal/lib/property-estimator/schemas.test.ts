import { describe, expect, it } from "vitest";
import { propertyFeatureSchema } from "./schemas";

const validPayload = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

describe("propertyFeatureSchema", () => {
  it("accepts valid property features", () => {
    const result = propertyFeatureSchema.parse(validPayload);

    expect(result.square_footage).toBe(1550);
    expect(result.school_rating).toBe(7.6);
  });

  it("coerces numeric form input strings", () => {
    const result = propertyFeatureSchema.parse({
      ...validPayload,
      square_footage: "1550",
      bedrooms: "3",
      bathrooms: "2"
    });

    expect(result.square_footage).toBe(1550);
    expect(result.bedrooms).toBe(3);
    expect(result.bathrooms).toBe(2);
  });

  it("rejects invalid school rating", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      school_rating: 11
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive square footage", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      square_footage: 0
    });

    expect(result.success).toBe(false);
  });
});
