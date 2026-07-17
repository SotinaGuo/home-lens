"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  defaultWhatIfValues,
  whatIfSchema,
  type WhatIfFormValues
} from "@/lib/market-analysis/schemas";

type WhatIfFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: WhatIfFormValues) => Promise<void> | void;
};

const fields: Array<{
  name: keyof WhatIfFormValues;
  label: string;
  inputMode: "numeric" | "decimal";
}> = [
  { name: "square_footage", label: "Square footage", inputMode: "numeric" },
  { name: "bedrooms", label: "Bedrooms", inputMode: "numeric" },
  { name: "bathrooms", label: "Bathrooms", inputMode: "decimal" },
  { name: "year_built", label: "Year built", inputMode: "numeric" },
  { name: "lot_size", label: "Lot size", inputMode: "numeric" },
  { name: "distance_to_city_center", label: "Distance to city center", inputMode: "decimal" },
  { name: "school_rating", label: "School rating", inputMode: "decimal" }
];

type WhatIfFormInput = z.input<typeof whatIfSchema>;

export function WhatIfForm({ isSubmitting, onSubmit }: WhatIfFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<WhatIfFormInput, unknown, WhatIfFormValues>({
    resolver: zodResolver(whatIfSchema),
    defaultValues: defaultWhatIfValues
  });

  return (
    <section className="surface-card p-5">
      <p className="eyebrow">
        What-if analysis
      </p>
      <h2 className="section-title">
        Test a property against the market
      </h2>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        {fields.map((field) => (
          <label className="block" key={field.name}>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              className="input mt-1"
              inputMode={field.inputMode}
              {...register(field.name)}
            />
            {errors[field.name]?.message ? (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {errors[field.name]?.message}
              </span>
            ) : null}
          </label>
        ))}
        <div className="md:col-span-2">
          <button
            className="btn-primary"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Running analysis..." : "Run what-if analysis"}
          </button>
        </div>
      </form>
    </section>
  );
}
