"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, isTheme, type Theme } from "./theme";

function subscribe(notify: () => void): () => void {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return isTheme(t) ? t : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

/** Real theme control: sets data-theme and remembers the choice. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = useCallback(() => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice applies for this page view only */
    }
  }, [next]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-line-strong px-3 font-mono text-sm text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised"
      aria-label={`Theme: ${theme}. Switch to ${next} theme`}
    >
      Theme: {theme}
    </button>
  );
}
