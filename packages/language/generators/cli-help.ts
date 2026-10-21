import { DIAGNOSTICS, KEYWORDS } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText, keywordSpellings } from './shared.ts';

export function renderCliHelpFiles(): readonly GeneratedFile[] {
  const categories = [...new Set(KEYWORDS.map((entry) => entry.category))].toSorted(compareText);
  const keywordLines = categories.map((category) => `${category}: ${keywordSpellings(KEYWORDS.filter((entry) => entry.category === category)).join(', ')}`);
  const diagnosticLines = DIAGNOSTICS.toSorted((left, right) => compareText(left.code, right.code)).map((entry) => `${entry.code}  ${entry.title}`);
  const content = ['Palavras-chave', '', ...keywordLines, '', 'Diagnósticos', '', ...diagnosticLines, ''].join('\n');
  return [{ path: 'packages/language/generated/cli-help.txt', content }];
}
