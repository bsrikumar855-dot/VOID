import type { Metadata } from "next";
import Link from "next/link";
import { listExperiments } from "@/registry";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every experiment currently available in VOID.",
};

/** Derived entirely from the registry: nothing is listed here that does not exist. */
export default function ExplorePage() {
  const items = listExperiments();
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
        Explore
      </h1>
      <p className="mt-3 max-w-[65ch] text-lg text-muted">
        {items.length === 1
          ? "One experiment so far. More arrive as they are built and verified."
          : `${items.length} experiments.`}
      </p>
      <ul className="mt-10 m-0 list-none divide-y divide-line border-y border-line p-0">
        {items.map((e) => (
          <li key={e.meta.id}>
            <Link
              href={`/experiments/${e.meta.slug}`}
              className="group grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8"
            >
              <span>
                <span className="block text-2xl font-semibold group-hover:underline group-hover:underline-offset-4">
                  {e.meta.title}
                </span>
                <span className="mt-1 block max-w-[65ch] text-muted">{e.meta.summary}</span>
              </span>
              <span className="text-sm text-muted">
                {e.meta.category} · {e.meta.tags.join(", ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
