import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { toJson } from './shared.ts';

const spellingOf = (js: string): string => {
  const entry = KEYWORDS.find((candidate) => candidate.js === js);
  if (entry === undefined) throw new Error(`keyword sem entrada na tabela: ${js}`);
  return entry.spelling;
};
const printName = (): string => {
  const entry = STDLIB.find((candidate) => candidate.js === 'console.log');
  if (entry === undefined) throw new Error('console.log sem entrada na tabela');
  return entry.name;
};

const buildSnippets = (): readonly (readonly [string, readonly string[]])[] => {
  const kw = spellingOf;
  return [
    [kw('if'), [`${kw('if')} (\${1:condicao}) {`, '  $0', `} ${kw('else')} {`, '  ', '}']],
    [kw('for'), [`${kw('for')} (${kw('let')} \${1:i} ${kw('=')} 0; \${1:i} ${kw('<')} \${2:limite}; \${1:i} ${kw('=')} \${1:i} ${kw('+')} 1) {`, '  $0', '}']],
    [kw('function'), [`${kw('function')} \${1:nome}(\${2:parametros}) {`, '  $0', '}']],
    [kw('class'), [`${kw('class')} \${1:Nome} {`, `  ${kw('constructor')}(\${2:parametros}) {`, '    $0', '  }', '}']],
    [kw('try'), [`${kw('try')} {`, '  $0', `} ${kw('catch')} (\${1:erro}) {`, '  ', '}']],
    [printName(), [`${printName()}(\${1:valor})`]],
  ];
};

export function renderSnippetsFiles(): readonly GeneratedFile[] {
  const entries = buildSnippets().map(([prefix, body]) => [prefix, { prefix, body, description: `Trecho de ${prefix}` }] as const);
  return [{ path: 'packages/language/generated/snippets.json', content: toJson(Object.fromEntries(entries)) }];
}
