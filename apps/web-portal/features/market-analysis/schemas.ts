import { z } from "zod";

const preprocessEmptyString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const optionalNumber = (schema: z.ZodNumber) =>
  preprocessEmptyString(schema.optional());

export const whatIfSchema = z.object({
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

export const segmentFilterSchema = z
  .object({
    minPrice: optionalNumber(
      z.coerce.number().min(0, "Minimum price cannot be negative")
    ),
    maxPrice: optionalNumber(
      z.coerce.number().min(0, "Maximum price cannot be negative")
    ),
    minBedrooms: optionalNumber(
      z.coerce
        .number()
        .int("Minimum bedrooms must be a whole number")
        .min(0, "Minimum bedrooms cannot be negative")
    ),
    maxBedrooms: optionalNumber(
      z.coerce
        .number()
        .int("Maximum bedrooms must be a whole number")
        .min(0, "Maximum bedrooms cannot be negative")
    ),
    minSchoolRating: optionalNumber(
      z.coerce
        .number()
        .min(0, "Minimum school rating must be at least 0")
        .max(10, "Minimum school rating must be at most 10")
    ),
    maxDistanceToCityCenter: optionalNumber(
      z.coerce
        .number()
        .min(0, "Maximum distance cannot be negative")
    )
  })
  .superRefine((values, context) => {
    if (
      values.minPrice !== undefined &&
      values.maxPrice !== undefined &&
      values.minPrice > values.maxPrice
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "Maximum price must be greater than or equal to minimum price"
      });
    }

    if (
      values.minBedrooms !== undefined &&
      values.maxBedrooms !== undefined &&
      values.minBedrooms > values.maxBedrooms
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxBedrooms"],
        message: "Maximum bedrooms must be greater than or equal to minimum bedrooms"
      });
    }
  });

export type WhatIfFormValues = z.infer<typeof whatIfSchema>;
export type SegmentFilterFormValues = z.infer<typeof segmentFilterSchema>;

export const defaultWhatIfValues: WhatIfFormValues = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

export const defaultSegmentFilters: SegmentFilterFormValues = {
  minPrice: undefined,
  maxPrice: undefined,
  minBedrooms: undefined,
  maxBedrooms: undefined,
  minSchoolRating: undefined,
  maxDistanceToCityCenter: undefined
};
