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
import type { PriceBucket } from "@/lib/market-analysis/types";

type PriceBucketChartProps = {
  buckets: PriceBucket[];
};

export function PriceBucketChart({ buckets }: PriceBucketChartProps) {
  return (
    <section className="surface-card p-5">
      <div>
        <p className="eyebrow">
          Price distribution
        </p>
        <h2 className="section-title">Market price buckets</h2>
      </div>
      {buckets.length === 0 ? (
        <p className="empty-state mt-5">No price bucket data available.</p>
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
