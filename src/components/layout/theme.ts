/** Theme names and the single localStorage key. */
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_STORAGE_KEY = "void-theme";

/**
 * Runs before first paint (static string, contains no user data).
 * A saved choice wins; otherwise follow the OS preference; default dark.
 * Any failure (storage blocked, etc.) leaves the default dark theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function isTheme(v: unknown): v is Theme {
  return v === "dark" || v === "light";
}
