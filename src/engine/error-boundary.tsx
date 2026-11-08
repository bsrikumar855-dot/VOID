"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches render errors inside an experiment's own React root (the host cannot, because
 * each experiment mounts its own root). Shows a plain message and a way to recover.
 * Deliberately does not render the error text.
 */
export class ExperimentErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-panel border border-line-strong bg-raised p-4"
      >
        <p className="m-0">This experiment hit an unexpected error and stopped.</p>
        <button
          type="button"
          className="min-h-11 rounded-control border border-line-strong px-3 font-medium hover:bg-surface"
          onClick={() => location.reload()}
        >
          Reload the page
        </button>
      </div>
    );
  }
}
