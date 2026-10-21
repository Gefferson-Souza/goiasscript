import type { KeywordEntry, StdlibEntry } from '../src/index.ts';

export const toJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

export const keywordSpellings = (entries: readonly KeywordEntry[]): readonly string[] =>
  entries.flatMap((entry) => [entry.spelling, ...(entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling])]);

const lastSegment = (name: string): string => name.split('.').at(-1) ?? name;

export const memberNames = (entry: StdlibEntry): readonly string[] => uniqueSorted([entry.name, entry.asciiName ?? entry.name].map(lastSegment));

export const stdlibSpellings = (entry: StdlibEntry): readonly string[] => (entry.asciiName === undefined ? [entry.name] : [entry.name, entry.asciiName]);

export const uniqueSorted = (names: readonly string[]): readonly string[] => [...new Set(names)].toSorted(compareText);
