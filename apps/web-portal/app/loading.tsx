export default function Loading() {
  return (
    <main className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Loading</p>
        <h1 className="page-title">Preparing HomeLens</h1>
        <p className="page-description">
          Loading the latest workspace state and analytics modules.
        </p>
      </section>

      <section className="surface-card p-5 md:p-6" aria-busy="true" aria-live="polite">
        <div className="space-y-4">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </section>
    </main>
  );
}
