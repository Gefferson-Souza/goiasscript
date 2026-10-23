const FAILURE_PREFIX = 'deu ruim: ';

export const ANY_FAILURE_LINE = new RegExp(FAILURE_PREFIX, 'u');

export const failureLineIn = (output: string): string | undefined => output.split('\n').find((line) => line.includes(FAILURE_PREFIX));

export const matchesAny = (text: string, patterns: readonly RegExp[]): boolean => patterns.some((pattern) => pattern.test(text));
