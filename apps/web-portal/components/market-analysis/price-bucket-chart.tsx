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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Price distribution
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Market price buckets</h2>
      </div>
      {buckets.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">No price bucket data available.</p>
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
