import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/**
 * Primary navigation lists only areas that contain a working experiment
 * (ADR 0003). Entries are added when an area ships its first experiment.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="min-h-11 content-center text-lg font-bold tracking-[0.18em] text-ink"
          aria-label="VOID home"
        >
          VOID
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center rounded-control px-3 text-ink hover:bg-raised"
          >
            Explore
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
