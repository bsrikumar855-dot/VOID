import Link from "next/link";
import previews from "../../../public/previews/index.json";
import type { AnyExperimentDefinition } from "@/engine/public";

interface Preview {
  file: string;
  width: number;
  height: number;
  alt: string;
}
const PREVIEWS: Record<string, Preview> = previews;

const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-line-strong px-5 font-semibold text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised";

/**
 * One experiment, shown with a real image of it (captured from the running experiment by
 * scripts/previews/capture.mjs, never a mock-up). The image's own aspect ratio decides the
 * composition: a wide diagram gets a wide column, a square image a narrower one. `flip` puts
 * the image on the right on large screens. Below 1024px everything is one column: text first,
 * then the image. An experiment with no captured image is listed without one.
 */
export function ExperimentSpecimen({
  experiment,
  flip,
}: {
  experiment: AnyExperimentDefinition;
  flip: boolean;
}) {
  const { meta } = experiment;
  const preview = PREVIEWS[meta.slug];
  const wide = preview ? preview.width / preview.height > 1.8 : false;

  const imageSpan = wide ? "lg:col-span-8" : "lg:col-span-6";
  const textSpan = wide ? "lg:col-span-4" : "lg:col-span-5";
  // Square images sit one column in from the edge so the pair does not read as a mirror.
  const textStart = !wide && !flip ? "lg:col-start-8" : "";
  const imageStart = !wide && flip ? "lg:col-start-7" : "";

  return (
    <article className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-12">
      <div
        className={`${textSpan} ${textStart} ${flip ? "lg:order-1" : "lg:order-2"} flex flex-col gap-4`}
      >
        <h3 className="m-0 text-2xl font-bold tracking-tight text-balance">{meta.title}</h3>
        <p className="m-0 max-w-[46ch] text-muted">{meta.summary}</p>
        <p className="m-0 font-mono text-sm text-muted">{meta.tags.join(" / ")}</p>
        <p className="m-0">
          <Link href={`/experiments/${meta.slug}`} className={secondaryCta}>
            Open {meta.title}
          </Link>
        </p>
      </div>
      {preview && (
        <figure
          className={`m-0 ${imageSpan} ${imageStart} ${flip ? "lg:order-2" : "lg:order-1"} flex flex-col gap-2`}
        >
          {/* A plain, pre-sized <img>: these files are already the right size (captured at 1x), so
              next/image would add its client runtime (about 5 KB gzip on the homepage) for nothing.
              Not loading="lazy": Chrome reports that as a DevTools issue, which tests/e2e/perf-budget.spec.ts rejects.
              Low fetch priority keeps them from competing with the hero. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/previews/${preview.file}`}
            alt={preview.alt}
            width={preview.width}
            height={preview.height}
            decoding="async"
            fetchPriority="low"
            className="h-auto w-full rounded-panel border border-line bg-surface"
          />
          <figcaption className="text-sm text-muted">
            Captured from the live experiment at its default settings.
          </figcaption>
        </figure>
      )}
    </article>
  );
}
