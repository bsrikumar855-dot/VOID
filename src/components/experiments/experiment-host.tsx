"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentHandle } from "@/engine/public";
import { decodeShare, encodeShare, type ShareErrorReason } from "@/engine/share/codec";
import { getExperiment } from "@/registry";

type Phase = "loading" | "ready" | "error";

const REASON_TEXT: Record<ShareErrorReason, string> = {
  "too-long": "This link is damaged or is not a VOID link.",
  "bad-prefix": "This link is damaged or is not a VOID link.",
  "bad-charset": "This link is damaged or is not a VOID link.",
  "bad-base64": "This link is damaged or is not a VOID link.",
  "too-large": "This link is damaged or is not a VOID link.",
  "bad-utf8": "This link is damaged or is not a VOID link.",
  "bad-json": "This link is damaged or is not a VOID link.",
  "bad-envelope": "This link is damaged or is not a VOID link.",
  "wrong-experiment": "This link belongs to a different experiment.",
  "unsupported-version": "This link was made with a different version of this experiment.",
  "invalid-config": "This link's settings are not valid for this experiment.",
};

interface Props {
  slug: string;
  presentation?: "page" | "embed";
  /** Embeds ignore and never write the URL fragment. */
  minHeightClass?: string;
}

/**
 * Client boundary for any experiment: reads the share fragment, validates it,
 * lazy-loads the experiment, mounts it, keeps the fragment in sync and cleans up.
 * Only the slug crosses from the server (manifests contain functions).
 */
export function ExperimentHost({
  slug,
  presentation = "page",
  minHeightClass = "min-h-[32rem]",
}: Props) {
  const shareable = presentation === "page";
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ExperimentHandle<unknown> | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [notice, setNotice] = useState<ShareErrorReason | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [attempt, setAttempt] = useState(0);
  const flushRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const def = getExperiment(slug);
    const host = hostRef.current;
    if (!def || !host) {
      setPhase("error");
      return;
    }
    const ac = new AbortController();
    let handle: ExperimentHandle<unknown> | null = null;

    // The configuration the user currently sees; used to restore the share URL if the
    // fragment is replaced by something else (for example the skip-to-content anchor).
    let current: unknown = def.defaultConfig;

    const writeNow = (config: unknown) => {
      current = config;
      const next = new URL(location.href);
      next.hash = encodeShare(def, config);
      history.replaceState(null, "", next);
      setUrl(location.href);
    };
    // Trailing debounce: painting emits a change per frame; browsers rate-limit replaceState.
    let pending: ReturnType<typeof setTimeout> | undefined;
    let pendingConfig: unknown;
    let hasPending = false;
    const writeFragment = (config: unknown, immediate = false) => {
      clearTimeout(pending);
      if (immediate) {
        hasPending = false;
        writeNow(config);
      } else {
        hasPending = true;
        pendingConfig = config;
        pending = setTimeout(() => {
          hasPending = false;
          writeNow(config);
        }, 150);
      }
    };
    // "Copy link" flushes a pending debounced write so it never copies a stale URL.
    flushRef.current = () => {
      if (!hasPending) return;
      clearTimeout(pending);
      hasPending = false;
      writeNow(pendingConfig);
    };

    const readFragment = (): { config: unknown; error: ShareErrorReason | null } => {
      if (!shareable || location.hash.length <= 1)
        return { config: def.defaultConfig, error: null };
      const r = decodeShare(location.hash, def);
      return r.ok
        ? { config: r.config, error: null }
        : { config: def.defaultConfig, error: r.reason };
    };

    (async () => {
      const mod = await def.load();
      if (ac.signal.aborted) return;
      // Read the fragment after loading: a hash change that arrived while loading must win.
      const { config, error } = readFragment();
      current = config;
      handle = mod.mount(host, {
        config,
        presentation,
        signal: ac.signal,
        onChange: (c: unknown) => {
          if (shareable && !ac.signal.aborted) writeFragment(c);
        },
      });
      handleRef.current = handle;
      setNotice(error);
      if (shareable) writeFragment(config, true);
      setPhase("ready");
    })().catch(() => {
      if (!ac.signal.aborted) setPhase("error");
    });

    const onHashChange = () => {
      if (!shareable || !handle) return;
      // Only fragments that claim to be share links ("#1...") are applied. Anything else
      // (the skip-to-content anchor, a stray #hash) must not reset the experiment or raise a
      // false "damaged link" notice: keep the current state and restore its share URL.
      if (!location.hash.startsWith("#1")) {
        writeNow(current);
        return;
      }
      const { config, error } = readFragment();
      current = config;
      setNotice(error);
      handle.setConfig(config);
      setUrl(location.href);
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      clearTimeout(pending);
      flushRef.current = null;
      ac.abort();
      handle?.destroy();
      handleRef.current = null;
    };
  }, [slug, presentation, shareable, attempt]);

  const copy = useCallback(async () => {
    try {
      flushRef.current?.();
      await navigator.clipboard.writeText(location.href);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 3000);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div
          role="alert"
          data-reason={notice}
          className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line-strong bg-raised px-4 py-3"
        >
          <p className="m-0 text-sm">{REASON_TEXT[notice]} Showing the default settings instead.</p>
          <button
            type="button"
            className="min-h-11 rounded-control border border-line-strong px-3 text-sm hover:bg-surface"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {phase === "loading" && (
        <p role="status" className={`m-0 flex items-center text-muted ${minHeightClass}`}>
          Loading experiment…
        </p>
      )}
      {phase === "error" && (
        <div role="alert" className={`flex flex-col items-start gap-3 ${minHeightClass}`}>
          <p className="m-0">This experiment could not be loaded.</p>
          <button
            type="button"
            className="min-h-11 rounded-control border border-line-strong px-3 hover:bg-raised"
            onClick={() => {
              setPhase("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* The experiment owns this element's contents; React must not render children here. */}
      <div ref={hostRef} hidden={phase !== "ready"} />

      {shareable && phase === "ready" && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label htmlFor={`share-${slug}`} className="text-sm text-muted">
            Share link: opens this exact experiment, settings and data
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id={`share-${slug}`}
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm"
            />
            <button
              type="button"
              className="min-h-11 rounded-control border border-line-strong px-4 font-medium hover:bg-raised"
              onClick={copy}
            >
              Copy link
            </button>
          </div>
          <p role="status" className="m-0 min-h-5 text-sm text-muted">
            {copied === "copied" && "Link copied."}
            {copied === "failed" &&
              "Copy was blocked by the browser. Select the link above and copy it."}
          </p>
        </div>
      )}
    </div>
  );
}
