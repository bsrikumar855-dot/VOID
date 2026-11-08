import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperimentHost } from "@/components/experiments/experiment-host";
import { getExperiment, listExperiments } from "@/registry";

export function generateStaticParams() {
  return listExperiments().map((e) => ({ slug: e.meta.slug }));
}

export async function generateMetadata(props: PageProps<"/experiments/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const def = getExperiment(slug);
  if (!def) return {};
  return { title: def.meta.title, description: def.meta.summary };
}

export default async function ExperimentPage(props: PageProps<"/experiments/[slug]">) {
  const { slug } = await props.params;
  const def = getExperiment(slug);
  if (!def) notFound();

  return (
    <article className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 max-w-[65ch]">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
          {def.meta.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{def.meta.summary}</p>
      </header>
      <ExperimentHost slug={def.meta.slug} />
    </article>
  );
}
