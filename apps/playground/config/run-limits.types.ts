import type { RUN_LIMITS } from './run-limits.constants.ts';

export type RunLimits = { readonly [Key in keyof typeof RUN_LIMITS]: number };
