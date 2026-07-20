"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  defaultSegmentFilters,
  segmentFilterSchema,
  type SegmentFilterFormValues
} from "@/features/market-analysis/schemas";

type SegmentFilterFormProps = {
  isLoading: boolean;
  onSubmit: (values: SegmentFilterFormValues) => Promise<void> | void;
};

type SegmentFilterFormInput = z.input<typeof segmentFilterSchema>;

export function SegmentFilterForm({ isLoading, onSubmit }: SegmentFilterFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<SegmentFilterFormInput, unknown, SegmentFilterFormValues>({
    resolver: zodResolver(segmentFilterSchema),
    defaultValues: defaultSegmentFilters
  });

  return (
    <section className="surface-card p-5">
      <div className="section-header">
        <div>
          <p className="eyebrow">
            Segment analysis
          </p>
          <h2 className="section-title">Filter market records</h2>
        </div>
        <button
          className="btn-secondary"
          onClick={() => reset(defaultSegmentFilters)}
          type="button"
        >
          Reset
        </button>
      </div>
      <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Min price" error={errors.minPrice?.message}>
          <input className="input" inputMode="decimal" {...register("minPrice")} />
        </Field>
        <Field label="Max price" error={errors.maxPrice?.message}>
          <input className="input" inputMode="decimal" {...register("maxPrice")} />
        </Field>
        <Field label="Min bedrooms" error={errors.minBedrooms?.message}>
          <input className="input" inputMode="numeric" {...register("minBedrooms")} />
        </Field>
        <Field label="Max bedrooms" error={errors.maxBedrooms?.message}>
          <input className="input" inputMode="numeric" {...register("maxBedrooms")} />
        </Field>
        <Field label="Min school rating" error={errors.minSchoolRating?.message}>
          <input className="input" inputMode="decimal" {...register("minSchoolRating")} />
        </Field>
        <Field label="Max distance to city center" error={errors.maxDistanceToCityCenter?.message}>
          <input className="input" inputMode="decimal" {...register("maxDistanceToCityCenter")} />
        </Field>
        <div className="md:col-span-3">
          <button
            className="btn-primary"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Filtering..." : "Apply filters"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  children,
  error,
  label
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="flex min-h-10 items-end text-sm font-medium leading-5 text-slate-700">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
