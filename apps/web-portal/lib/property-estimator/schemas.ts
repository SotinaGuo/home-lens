import { z } from "zod";

const preprocessEmptyString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

export const propertyFeatureSchema = z.object({
  square_footage: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Square footage is required" })
      .positive("Square footage must be greater than 0")
  ),
  bedrooms: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Bedrooms is required" })
      .int("Bedrooms must be a whole number")
      .min(0, "Bedrooms cannot be negative")
  ),
  bathrooms: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Bathrooms is required" })
      .min(0, "Bathrooms cannot be negative")
  ),
  year_built: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Year built is required" })
      .int("Year built must be a whole number")
      .min(1800, "Year built must be 1800 or later")
      .max(2100, "Year built must be 2100 or earlier")
  ),
  lot_size: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Lot size is required" })
      .positive("Lot size must be greater than 0")
  ),
  distance_to_city_center: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Distance to city center is required" })
      .min(0, "Distance cannot be negative")
  ),
  school_rating: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "School rating is required" })
      .min(0, "School rating must be at least 0")
      .max(10, "School rating must be at most 10")
  )
});

export type PropertyFeatureFormValues = z.infer<typeof propertyFeatureSchema>;

export const defaultPropertyValues: PropertyFeatureFormValues = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};
