import Link from "next/link";
import { ExperimentHost } from "@/components/experiments/experiment-host";
import { REPO_URL } from "@/components/layout/site-footer";
import { encodeShare } from "@/engine/share/codec";
import { listExperiments } from "@/registry";

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
  // The first registry entry is the featured experiment.
  const featured = experiments[0];
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
              <h2 id="examples-title" className="text-3xl font-bold tracking-tight text-balance">
                Settings and data live in the link
              </h2>
              <p className="mt-4 max-w-[40ch] text-muted">
                Change an experiment, copy its link, send it. Whoever opens it sees the same
                settings and the same data, and gets the same results. (Playback speed is yours to
                choose and is not part of the link.) These start from interesting races.
              </p>
            </div>
            <ul className="m-0 list-none divide-y divide-line border-y border-line p-0 lg:col-span-8">
              {examples.map((x) => (
                <li key={`${x.experiment.meta.id}:${x.title}`}>
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
            </ul>
          </div>
        </section>
      )}

      <section
        aria-labelledby="build-title"
        className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20"
      >
        <div>
          <h2 id="build-title" className="text-3xl font-bold tracking-tight text-balance">
            Add an experiment
          </h2>
          <p className="mt-4 max-w-[52ch] text-muted">
            VOID is open source. Not built yet: neural network playground, traffic simulator, agent
            arena, codebase x-ray, accounts, publishing and remixing. They are on the{" "}
            <a
              className="text-accent underline underline-offset-4"
              href={`${REPO_URL}/blob/main/docs/roadmap.md`}
              rel="noopener noreferrer"
            >
              roadmap
            </a>{" "}
            and will appear here only once they work.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-muted marker:text-ink">
            <li>
              Create <code className="font-mono text-ink">src/experiments/your-slug/</code> with a
              manifest, a settings schema, a pure core and a view.
            </li>
            <li>
              Add an import and one entry to the registry. Explore, the example links and the
              featured hero (the first entry) are derived from it.
            </li>
            <li>
              Run <code className="font-mono text-ink">npm run check</code>. The registry contract
              tests check your experiment automatically.
            </li>
          </ol>
          <p>
            <a
              className={secondaryCta}
              href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
              rel="noopener noreferrer"
            >
              Read the contribution guide
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
