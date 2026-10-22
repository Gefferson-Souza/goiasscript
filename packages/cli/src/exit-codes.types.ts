import type { EXIT_CODE } from './exit-codes.constants.ts';

export type ExitCode = (typeof EXIT_CODE)[keyof typeof EXIT_CODE];
