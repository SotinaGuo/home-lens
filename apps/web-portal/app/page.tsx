export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Housing Intelligence Portal
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        A unified portal for property valuation demos.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        App 1 connects to the Python property estimator backend. App 2 is kept as
        a scoped placeholder until the Java market analysis backend is built.
      </p>
    </main>
  );
}
