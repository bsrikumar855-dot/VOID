import { REPO_URL } from "@/components/layout/site-footer";

/**
 * M1 home: deliberately minimal and honest. The real homepage (live sorting
 * race hero, registry-driven sections) is milestone M3. Nothing here is
 * fabricated: no stats, no activity, no experiments that do not exist.
 */
export default function Home() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <p className="font-mono text-sm text-muted">VOID / interactive technology</p>
      <h1 className="mt-4 max-w-[14ch] text-[clamp(2.5rem,7vw,5rem)] font-bold uppercase leading-[0.95] tracking-tight">
        The web is your playground.
      </h1>
      <p className="mt-6 max-w-[48ch] text-lg text-muted">
        Don&apos;t just browse technology. Interact with it. Explore systems. Break things. Build
        experiments. Share discoveries.
      </p>
      <p className="mt-10 max-w-[56ch] border-l-2 border-line-strong pl-4 font-mono text-sm text-muted">
        Status: early development, built in the open. The first experiment (a sorting race) and the
        full homepage are the next milestones. There is nothing to try yet.
      </p>
      <p className="mt-6">
        <a
          href={REPO_URL}
          className="inline-flex min-h-11 items-center rounded-control border border-line-strong px-4 font-mono text-sm text-ink hover:bg-raised"
          rel="noopener noreferrer"
        >
          Follow the build on GitHub
        </a>
      </p>
    </section>
  );
}
