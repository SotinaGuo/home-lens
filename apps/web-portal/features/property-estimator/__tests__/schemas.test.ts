import { describe, expect, it } from "vitest";
import { propertyFeatureSchema } from "../schemas";

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

  it("rejects non-positive square footage", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      square_footage: 0
    });

    expect(result.success).toBe(false);
  });

  it("rejects blank strings for required numeric fields", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      bathrooms: "",
      school_rating: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer bedrooms", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      bedrooms: 2.5
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative bedrooms", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      bedrooms: -1
    });

    expect(result.success).toBe(false);
  });

  it("accepts zero bathrooms", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      bathrooms: 0
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative bathrooms", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      bathrooms: -0.5
    });

    expect(result.success).toBe(false);
  });

  it("rejects year built below lower bound", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      year_built: 1799
    });

    expect(result.success).toBe(false);
  });

  it("rejects year built above upper bound", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      year_built: 2101
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive lot size", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      lot_size: 0
    });

    expect(result.success).toBe(false);
  });

  it("accepts zero distance to city center", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      distance_to_city_center: 0
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative distance to city center", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      distance_to_city_center: -0.1
    });

    expect(result.success).toBe(false);
  });

  it("rejects school rating below lower bound", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      school_rating: -0.1
    });

    expect(result.success).toBe(false);
  });

  it("rejects school rating above upper bound", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      school_rating: 11
    });

    expect(result.success).toBe(false);
  });
});
