"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Application error</p>
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-description">
          HomeLens could not render this page. Try again, or check whether the
          related backend service is running.
        </p>
      </section>

      <section className="surface-card p-5 md:p-6">
        <div className="error-state">
          {error.message || "An unexpected portal error occurred."}
        </div>
        <button className="btn-primary mt-5" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
