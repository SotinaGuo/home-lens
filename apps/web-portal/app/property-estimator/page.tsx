import { EstimatorDashboard } from "@/components/property-estimator/estimator-dashboard";

export default function PropertyEstimatorPage() {
  return (
    <main className="page-stack">
      <section className="page-header">
        <p className="eyebrow">
          App 1 · Python Backend
        </p>
        <h1 className="page-title">
          Property Value Estimator
        </h1>
        <p className="page-description">
          Enter property features, generate a predicted value, then compare estimates
          from the current backend session.
        </p>
      </section>

      <EstimatorDashboard />
    </main>
  );
}
