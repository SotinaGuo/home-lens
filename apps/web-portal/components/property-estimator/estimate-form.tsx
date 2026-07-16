"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  defaultPropertyValues,
  propertyFeatureSchema,
  type PropertyFeatureFormValues
} from "@/lib/property-estimator/schemas";

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
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Property input
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Estimate a property value
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Fill in the same features used by the ML model.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label className="block" key={field.name}>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              step={field.step ?? "1"}
              type="number"
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors[field.name]?.message}
              </span>
            ) : null}
          </label>
        ))}
      </div>

      <button
        className="mt-6 inline-flex w-full justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating estimate..." : "Create estimate"}
      </button>
    </form>
  );
}
