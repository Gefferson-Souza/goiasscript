import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { createConfig } from '../../../eslint.config.mjs';

const projectService = { allowDefaultProject: ['packages/*/src/*.ts', 'packages/*/src/*/*.ts'], maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 200 };
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: createConfig(projectService) });
const messagesFor = async (code, filePath) => (await eslint.lintText(code, { filePath }))[0].messages.map((m) => m.ruleId ?? m.message);

const SRC = 'packages/language/src/virtual.ts';
const LEXER = 'packages/compiler/src/lexer/virtual.ts';
const NOOP = 'function noop(): void {\n  return;\n}\n';
const fn = (body, params = '') => `${NOOP}export function f(${params}): void {\n${body}\n}\n`;
const tryCatch = (handler) => fn(`  try {\n    noop();\n  } catch (error) {${handler}}`);
const holder = (body) => `export class Holder {\n  pos = 0;\n  items: number[] = [];\n  scopes = new Map<string, number>();\n  run(): void {\n    ${body}\n  }\n}\n`;
const nested = 'if (a) {'.repeat(5);

const violations = [
  ['sem any', SRC, 'export const value: any = 1;\n', '@typescript-eslint/no-explicit-any'],
  ['@ts-ignore proibido', SRC, '// @ts-ignore\nexport const value: number = "a";\n', '@typescript-eslint/ban-ts-comment'],
  ['@ts-expect-error exige descrição', SRC, '// @ts-expect-error\nexport const value: number = "a";\n', '@typescript-eslint/ban-ts-comment'],
  ['eslint-disable exige motivo', SRC, '/* eslint-disable no-console */\nconsole.log(1);\n', '@eslint-community/eslint-comments/require-description'],
  ['eslint-disable sem efeito é erro', SRC, '// eslint-disable-next-line no-console -- motivo qualquer\nexport const value = 1;\n', /Unused eslint-disable/],
  ['sem número mágico', SRC, 'export const total = 37 * 3;\n', '@typescript-eslint/no-magic-numbers'],
  ['sem reatribuir parâmetro', SRC, fn('  a = 2;', 'a: number'), 'no-param-reassign'],
  ['sem mutar lista recebida', SRC, fn('  list.push(1);', 'list: number[]'), 'functional/immutable-data'],
  ['parâmetro continua imutável no lexer', LEXER, fn('  p.x = 1;', 'p: { x: number }'), 'functional/immutable-data'],
  ['this fora de lexer, parser e analyzer', 'packages/compiler/src/lowering/virtual.ts', holder('this.pos += 1;'), 'functional/immutable-data'],
  ['prefer-const', SRC, 'let value = 1;\nexport const copy = value;\n', 'prefer-const'],
  ['sem var', SRC, 'export var value = 1;\n', 'no-var'],
  ['catch vazio', SRC, tryCatch(''), 'no-empty'],
  ['catch que engole o erro', SRC, tryCatch('\n    noop();\n  '), 'no-restricted-syntax'],
  ['interface exportada fora de *.types.ts', SRC, 'export interface Entry {\n  readonly name: string;\n}\n', 'no-restricted-syntax'],
  ['arquivo acima de 800 linhas', SRC, `export {};\n${'\n'.repeat(800)}`, 'max-lines'],
  ['função acima de 50 linhas', SRC, `${NOOP}export function f(): void {\n${'  noop();\n'.repeat(49)}}\n`, 'max-lines-per-function'],
  ['aninhamento acima de 4', SRC, fn(`  ${nested}\n  f(a);\n${'}'.repeat(5)}`, 'a: boolean'), 'max-depth'],
  ['sem console', SRC, 'console.log(1);\n', 'no-console'],
  ['função fora de camelCase', SRC, 'export function Foo_bar(): void {\n  return;\n}\n', '@typescript-eslint/naming-convention'],
];
const accepted = [
  ['this.pos no lexer', LEXER, holder('this.pos += 1;'), 'functional/immutable-data'],
  ['this.items.push no parser', 'packages/compiler/src/parser/virtual.ts', holder('this.items.push(1);'), 'functional/immutable-data'],
  ['this.scopes.set no analyzer', 'packages/compiler/src/analyzer/virtual.ts', holder("this.scopes.set('a', 1);"), 'functional/immutable-data'],
  ['interface em *.types.ts', 'packages/language/src/virtual.types.ts', 'export interface Entry {\n  readonly name: string;\n}\n', 'no-restricted-syntax'],
  ['catch que relança', SRC, tryCatch('\n    throw error;\n  '), 'no-restricted-syntax'],
];

describe('matriz de regras do ESLint (§8.1)', () => {
  it.each(violations)('barra: %s', async (_title, filePath, code, expected) => {
    expect(await messagesFor(code, filePath)).toContainEqual(typeof expected === 'string' ? expected : expect.stringMatching(expected));
  });
  it.each(accepted)('aceita: %s', async (_title, filePath, code, ruleId) => {
    expect(await messagesFor(code, filePath)).not.toContain(ruleId);
  });
});
