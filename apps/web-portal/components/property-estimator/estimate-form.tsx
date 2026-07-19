"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  defaultPropertyValues,
  propertyFeatureSchema,
  type PropertyFeatureFormValues
} from "@/features/property-estimator/schemas";

type EstimateFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: PropertyFeatureFormValues) => void;
};

const fields: Array<{
  name: keyof PropertyFeatureFormValues;
  label: string;
  step?: string;
}> = [
  { name: "square_footage", label: "Square footage" },
  { name: "bedrooms", label: "Bedrooms" },
  { name: "bathrooms", label: "Bathrooms", step: "0.5" },
  { name: "year_built", label: "Year built" },
  { name: "lot_size", label: "Lot size" },
  { name: "distance_to_city_center", label: "Distance to city center", step: "0.1" },
  { name: "school_rating", label: "School rating", step: "0.1" }
];

type PropertyFeatureFormInput = z.input<typeof propertyFeatureSchema>;

export function EstimateForm({ isSubmitting, onSubmit }: EstimateFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<PropertyFeatureFormInput, unknown, PropertyFeatureFormValues>({
    resolver: zodResolver(propertyFeatureSchema),
    defaultValues: defaultPropertyValues
  });

  return (
    <form
      className="surface-card p-5 md:p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <p className="eyebrow">
          Property input
        </p>
        <h2 className="section-title">
          Estimate a property value
        </h2>
        <p className="section-copy">
          Fill in the same features used by the ML model.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label className="block" key={field.name}>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              className="input mt-1"
              step={field.step ?? "1"}
              type="number"
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {errors[field.name]?.message}
              </span>
            ) : null}
          </label>
        ))}
      </div>

      <button
        className="btn-primary mt-6 w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating estimate..." : "Create estimate"}
      </button>
    </form>
  );
}
