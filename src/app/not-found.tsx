import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 max-w-[60ch] text-lg text-muted">
        There is nothing at this address. Every experiment can be opened from Explore.
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/explore"
          className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 font-semibold text-accent-ink hover:opacity-90"
        >
          Explore experiments
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-control border border-line-strong px-5 font-semibold hover:bg-raised"
        >
          Home
        </Link>
      </p>
    </section>
  );
}
