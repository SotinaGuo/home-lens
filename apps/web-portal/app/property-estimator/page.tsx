import { EstimatorDashboard } from "@/components/property-estimator/estimator-dashboard";

export default function PropertyEstimatorPage() {
  return (
    <main className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          App 1 · Python Backend
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Property Value Estimator
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Submit property details, call the Python backend through the Next.js proxy,
          and review estimates returned by the ML model pipeline.
        </p>
      </section>

      <EstimatorDashboard />
    </main>
  );
}
