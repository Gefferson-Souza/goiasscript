import fs from 'node:fs';
import path from 'node:path';
import { ENGLISH_ALLOWLIST_PATH, FORBIDDEN_ENGLISH_PATH, QUOTED_IDENTIFIER, REGEX_SPECIALS, WORD_CHAR } from './gate.constants.ts';
import type { AllowEntry, EnglishRules, ForbiddenEntry, GateProblem, UiString } from './gate.types.ts';

const DEFAULT_FLAGS = 'u';
const hasReason = (reason: string): boolean => reason.trim() !== '';

export function loadEnglishRules(root: string): EnglishRules {
  const read = (relative: string): unknown => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  return { forbidden: read(FORBIDDEN_ENGLISH_PATH) as readonly ForbiddenEntry[], allowlist: read(ENGLISH_ALLOWLIST_PATH) as readonly AllowEntry[] };
}

export const compilePattern = (entry: ForbiddenEntry): RegExp => new RegExp(entry.pattern, entry.flags ?? DEFAULT_FLAGS);

function rulesProblems(forbidden: readonly ForbiddenEntry[], allowlist: readonly AllowEntry[]): readonly GateProblem[] {
  const forbiddenProblems = forbidden.filter((entry) => !hasReason(entry.reason)).map((entry) => ({ file: FORBIDDEN_ENGLISH_PATH, message: `a proibição "${entry.pattern}" está sem razão.` }));
  const allowProblems = allowlist.filter((entry) => !hasReason(entry.reason)).map((entry) => ({ file: ENGLISH_ALLOWLIST_PATH, message: `uma permissão (${entry.kind}) está sem razão.` }));
  return [...forbiddenProblems, ...allowProblems];
}

const properNamePattern = (name: string): RegExp => new RegExp(`(?<!${WORD_CHAR})${name.replace(REGEX_SPECIALS, '\\$&')}(?!${WORD_CHAR})`, 'gu');

function stripAllowed(item: UiString, text: string, entry: AllowEntry): string {
  if (entry.kind === 'proper-name') return text.replace(properNamePattern(entry.text), '');
  if (entry.kind === 'quoted-in-diagnostic' && item.diagnosticCode?.startsWith(entry.codePrefix) === true) return text.replace(QUOTED_IDENTIFIER, '');
  return text;
}

function visibleText(item: UiString, allowlist: readonly AllowEntry[]): string | null {
  if (allowlist.some((entry) => entry.kind === 'emitted-code' && entry.source === item.source)) return null;
  return allowlist.reduce((text, entry) => stripAllowed(item, text, entry), item.text);
}

export function checkEnglish(strings: readonly UiString[], forbidden: readonly ForbiddenEntry[], allowlist: readonly AllowEntry[]): readonly GateProblem[] {
  const patterns = forbidden.map((entry) => ({ entry, regex: compilePattern(entry) }));
  const hits = strings.flatMap((item) => {
    const text = visibleText(item, allowlist);
    if (text === null) return [];
    return patterns.filter(({ regex }) => regex.test(text)).map(({ entry }) => ({ file: item.source, message: `"${item.text}" casa o inglês proibido /${entry.pattern}/: ${entry.reason}.` }));
  });
  return [...rulesProblems(forbidden, allowlist), ...hits];
}

export function findEnglishHits(text: string, entries: readonly ForbiddenEntry[]): readonly string[] {
  return entries.filter((entry) => compilePattern(entry).test(text)).map((entry) => entry.pattern);
}
