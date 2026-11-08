import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/**
 * Primary navigation lists only areas that contain a working experiment
 * (ADR 0003). At M1 there are none, so the header carries the wordmark and
 * the theme control only. Entries are added with the first experiment.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="min-h-11 content-center font-mono text-lg font-semibold tracking-[0.2em] text-ink"
          aria-label="VOID home"
        >
          VOID
        </Link>
        <nav aria-label="Site controls">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
