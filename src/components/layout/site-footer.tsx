export const REPO_URL = "https://github.com/bsrikumar855-dot/VOID";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
        <p>VOID · open source · Apache-2.0</p>
        <a
          href={REPO_URL}
          className="min-h-11 content-center text-accent underline underline-offset-4"
          rel="noopener noreferrer"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
