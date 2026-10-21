import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText } from './shared.ts';

const byCategoryThenName = (left: { readonly key: string; readonly name: string }, right: { readonly key: string; readonly name: string }): number =>
  compareText(left.key, right.key) || compareText(left.name, right.name);

export function renderReferenceFiles(): readonly GeneratedFile[] {
  const keywordRows = KEYWORDS.map((entry) => ({ key: entry.category, name: entry.spelling, row: `| \`${entry.spelling}\` | \`${entry.js}\` | ${entry.keywordClass} | ${entry.category} |` }))
    .toSorted(byCategoryThenName).map((item) => item.row);
  const libraryRows = STDLIB.map((entry) => ({ key: entry.receiver, name: entry.name, row: `| \`${entry.name}\` | ${entry.receiver} | ${entry.form ?? entry.kind} | \`${entry.js}\` | ${entry.semantics} |` }))
    .toSorted(byCategoryThenName).map((item) => item.row);
  const content = [
    '# Referência do vocabulário', '',
    '## Palavras-chave', '', '| GoiásScript | JavaScript | Classe | Categoria |', '|---|---|---|---|', ...keywordRows, '',
    '## Biblioteca', '', '| Nome | Receptor | Forma | JS | Semântica |', '|---|---|---|---|---|', ...libraryRows, '',
  ].join('\n');
  return [{ path: 'packages/language/generated/reference.md', content }];
}
