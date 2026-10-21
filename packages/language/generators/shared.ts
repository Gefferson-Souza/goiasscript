import type { KeywordEntry, StdlibEntry } from '../src/index.ts';

export const toJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

export const keywordSpellings = (entries: readonly KeywordEntry[]): readonly string[] =>
  entries.flatMap((entry) => [entry.spelling, ...(entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling])]);

export const memberName = (entry: StdlibEntry): string => entry.name.split('.').at(-1) ?? entry.name;

export const uniqueSorted = (names: readonly string[]): readonly string[] => [...new Set(names)].toSorted(compareText);
