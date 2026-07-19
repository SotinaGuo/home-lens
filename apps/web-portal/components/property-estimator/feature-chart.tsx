"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PropertyFeatures } from "@/features/property-estimator/types";

type FeatureChartProps = {
  features: PropertyFeatures;
};

export function FeatureChart({ features }: FeatureChartProps) {
  const data = [
    { label: "Sq ft", value: features.square_footage },
    { label: "Lot", value: features.lot_size },
    { label: "Distance", value: features.distance_to_city_center },
    { label: "School", value: features.school_rating }
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
