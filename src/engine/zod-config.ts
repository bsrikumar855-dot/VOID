import { z } from "zod";

/**
 * Zod 4 compiles ("JITs") object schemas with `new Function`, and reads this flag when each
 * schema is CONSTRUCTED, so this module must be evaluated before any schema is built (import
 * it first, as the registry and the share codec do). Our CSP forbids eval, so without this the
 * browser logs a CSP violation on every page that loads Zod (found by Lighthouse's
 * inspector-issues audit) while Zod silently falls back. Configs are tiny, so turning the JIT
 * off has no measurable cost.
 */
z.config({ jitless: true });
