"use client";

/** Route-level error boundary. Never renders the error message (it may contain internals). */
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-[60ch] text-lg text-muted">
        This page failed to load. Trying again often fixes it.
      </p>
      <p className="mt-8">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 font-semibold text-accent-ink hover:opacity-90"
        >
          Try again
        </button>
      </p>
    </section>
  );
}
