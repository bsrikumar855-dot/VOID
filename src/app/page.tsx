import Link from "next/link";
import { ExperimentHost } from "@/components/experiments/experiment-host";
import { REPO_URL } from "@/components/layout/site-footer";
import { encodeShare } from "@/engine/share/codec";
import { listExperiments } from "@/registry";

const FEATURED_SLUG = "algorithm-arena";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 font-semibold text-accent-ink transition-opacity duration-[var(--dur-feedback)] hover:opacity-90";
const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-line-strong px-5 font-semibold text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised";

/**
 * Homepage (ADR 0001/0003). Everything here is real: the hero is a live
 * experiment, the example links are real share links derived from the registry,
 * and no community, trending or activity content is shown because none exists.
 */
export default function Home() {
  const experiments = listExperiments();
  const featured = experiments.find((e) => e.meta.slug === FEATURED_SLUG) ?? experiments[0];
  const examples = experiments.flatMap((e) =>
    (e.examples ?? []).map((x) => ({
      experiment: e,
      title: x.title,
      note: x.note,
      href: `/experiments/${e.meta.slug}#${encodeShare(e, x.config)}`,
    })),
  );

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-24 lg:pt-20"
      >
        <div className="lg:col-span-5">
          <h1
            id="hero-title"
            className="text-[clamp(2.25rem,5vw,4rem)] font-bold uppercase leading-[0.95] tracking-tight text-balance"
          >
            The web is your playground.
          </h1>
          <p className="mt-6 max-w-[40ch] text-lg text-muted">
            Don&apos;t just browse technology. Interact with it. Explore systems. Break things.
            Build experiments. Share discoveries.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/experiments/${featured.meta.slug}`} className={primaryCta}>
              Enter the lab
            </Link>
            <Link href="/explore" className={secondaryCta}>
              Explore experiments
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="mb-3 max-w-[60ch] text-sm text-muted">
            This is a live experiment, not an animation: two sorting algorithms race on the same
            data, and every count comes from the algorithms&apos; recorded operations.
          </p>
          <ExperimentHost
            slug={featured.meta.slug}
            presentation="embed"
            minHeightClass="min-h-[34rem]"
          />
        </div>
      </section>

      {examples.length > 0 && (
        <section aria-labelledby="examples-title" className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-20">
            <div className="lg:col-span-4">
              <h2 id="examples-title" className="text-3xl font-bold tracking-tight">
                Every setting is in the link
              </h2>
              <p className="mt-4 max-w-[40ch] text-muted">
                Change an experiment, copy its link, send it. Whoever opens it sees the same
                settings and the same data, and gets the same results. These three start from
                interesting races.
              </p>
            </div>
            <ol className="m-0 list-none divide-y divide-line border-y border-line p-0 lg:col-span-8">
              {examples.map((x) => (
                <li key={x.title}>
                  <Link
                    href={x.href}
                    className="group grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8"
                  >
                    <span>
                      <span className="block text-xl font-semibold group-hover:underline group-hover:underline-offset-4">
                        {x.title}
                      </span>
                      <span className="mt-1 block max-w-[62ch] text-muted">{x.note}</span>
                    </span>
                    <span className="text-sm text-muted">{x.experiment.meta.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section
        aria-labelledby="build-title"
        className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-20"
      >
        <div className="lg:col-span-4">
          <h2 id="build-title" className="text-3xl font-bold tracking-tight">
            Built in the open, by whoever shows up
          </h2>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-8">
          <p className="max-w-[62ch] text-muted">
            VOID is open source. An experiment is one folder with a manifest, a settings schema, a
            pure core and a view. Adding one takes a single line in the registry. Everything else
            (this page, Explore, navigation) picks it up on its own.
          </p>
          <p className="max-w-[62ch] text-muted">
            Not built yet: neural network playground, traffic simulator, agent arena, codebase
            x-ray, accounts, publishing and remixing. They are on the{" "}
            <a
              className="text-accent underline underline-offset-4"
              href={`${REPO_URL}/blob/main/docs/roadmap.md`}
              rel="noopener noreferrer"
            >
              roadmap
            </a>
            , and they will appear here only once they work.
          </p>
          <p>
            <a
              className={secondaryCta}
              href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
              rel="noopener noreferrer"
            >
              How to add an experiment
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
