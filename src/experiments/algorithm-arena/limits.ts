/**
 * Numeric limits of the Algorithm Arena, in a module with NO runtime imports.
 * The client view imports from here rather than from config.ts (which defines the Zod schema),
 * so the view's JavaScript does not drag Zod into every page (see docs/perf).
 */
export const MIN_SIZE = 8;
export const MAX_SIZE = 128;
export const MAX_VALUE = 256;
