import { RETIRED_WORDS } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';

const NO_REPLACEMENT = 'sem equivalente';
const INTRO = 'Palavras de versões anteriores que não existem no GoiásScript 3. Elas não são reservadas; só melhoram a mensagem de erro (GS0306).';

export function renderRetiredPageFiles(): readonly GeneratedFile[] {
  const rows = RETIRED_WORDS.map((entry) => `| \`${entry.word}\` | ${entry.replacement === undefined ? NO_REPLACEMENT : `\`${entry.replacement}\``} | ${entry.note} |`);
  const content = ['# O que mudou', '', INTRO, '', '| Aposentada | Forma na v3 | Observação |', '|---|---|---|', ...rows, ''].join('\n');
  return [{ path: 'docs/spec/o-que-mudou.md', content }];
}
