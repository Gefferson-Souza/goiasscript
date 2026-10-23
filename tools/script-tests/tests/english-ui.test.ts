import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { executeModule } from '../../../packages/compiler/tests/support/execute-module.ts';
import { checkEnglish, findEnglishHits, loadEnglishRules } from '../../../scripts/english-ui.ts';
import type { AllowEntry, ForbiddenEntry, UiString } from '../../../scripts/gate.types.ts';
import { extractStringLiterals } from '../../../scripts/ui-strings.literals.ts';
import { collectCatalogStrings, collectUserFacingStrings } from '../../../scripts/ui-strings.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const FORBIDDEN: readonly ForbiddenEntry[] = [
  { pattern: 'is not a function', scope: 'engine', reason: 'frase do motor' },
  { pattern: '\\bfailed\\b', flags: 'iu', scope: 'ui', reason: 'palavra comum de erro em inglês' },
];
const CATALOG_ALLOW: AllowEntry = { kind: 'quoted-in-diagnostic', codePrefix: 'GS04', reason: 'o trecho entre aspas cita o JavaScript do usuário' };
const text = (value: string, source = 'ui', diagnosticCode?: string): UiString => ({ source, text: value, ...(diagnosticCode === undefined ? {} : { diagnosticCode }) });

describe('checkEnglish', () => {
  it('acusa mensagem em inglês fora da permissão', () => {
    const problems = checkEnglish([text('Build failed, sô', 'cli:help')], FORBIDDEN, []);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.file).toBe('cli:help');
    expect(problems[0]?.message).toContain('failed');
  });

  it('aceita o trecho entre aspas em GS04xx', () => {
    const quoted = text('Ô sô, "x is not a function" é do JavaScript.', 'diagnostic', 'GS0403');
    expect(checkEnglish([quoted], FORBIDDEN, [CATALOG_ALLOW])).toEqual([]);
    const outside = text('Ô sô, "x is not a function" é do JavaScript.', 'diagnostic', 'GS0301');
    expect(checkEnglish([outside], FORBIDDEN, [CATALOG_ALLOW])).toHaveLength(1);
  });

  it('aceita nome próprio da lista de permissão e recusa o mesmo texto sem a permissão', () => {
    const proper: AllowEntry = { kind: 'proper-name', text: 'Node.js failed', reason: 'nome de exemplo' };
    expect(checkEnglish([text('Node.js failed')], FORBIDDEN, [proper])).toEqual([]);
    expect(checkEnglish([text('Node.js failed')], FORBIDDEN, [])).toHaveLength(1);
  });

  it('isenta a fonte marcada como código emitido', () => {
    const emitted: AllowEntry = { kind: 'emitted-code', source: 'painel:js', reason: 'conteúdo do painel de JS gerado' };
    expect(checkEnglish([text('x is not a function', 'painel:js')], FORBIDDEN, [emitted])).toEqual([]);
  });

  it('permissão sem razão falha', () => {
    const noReason: AllowEntry = { kind: 'proper-name', text: 'npm', reason: '   ' };
    const problems = checkEnglish([], FORBIDDEN, [noReason]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('sem razão');
  });

  it('proibição sem razão falha', () => {
    const problems = checkEnglish([], [{ pattern: 'oops', scope: 'ui', reason: '' }], []);
    expect(problems[0]?.message).toContain('sem razão');
  });
});

describe('regras versionadas', () => {
  const rules = loadEnglishRules(ROOT_DIR);

  it('a lista do motor traz as sete frases do spec', () => {
    const engine = rules.forbidden.filter((entry) => entry.scope === 'engine').map((entry) => entry.pattern);
    for (const phrase of ['Cannot read properties', 'is not a function', 'is not a constructor', 'before initialization', 'Maximum call stack', 'Invalid count value', 'toFixed\\(\\)']) {
      expect(engine).toContain(phrase);
    }
  });

  it('toda permissão e toda proibição versionada tem razão', () => {
    expect(checkEnglish([], rules.forbidden, rules.allowlist)).toEqual([]);
  });
});

describe('strings vistas pelo usuário', () => {
  const rules = loadEnglishRules(ROOT_DIR);

  it('o catálogo nos dois tons passa', () => {
    const strings = collectCatalogStrings();
    expect(new Set(strings.map((item) => item.source))).toEqual(new Set(['diagnostics:raiz', 'diagnostics:neutro', 'diagnostics:example']));
    expect(checkEnglish(strings, rules.forbidden, rules.allowlist)).toEqual([]);
  });

  it('a coleta traz catálogo, ajuda, interface e mensagens do Worker', () => {
    const sources = new Set(collectUserFacingStrings().map((item) => item.source.split(':')[0]));
    for (const expected of ['diagnostics', 'cli-help.txt', 'apps/playground/components/ui-texts.constants.ts', 'apps/engoianador-api/src/messages.constants.ts']) {
      expect(sources).toContain(expected);
    }
  });

  it('nenhuma string visível ao usuário casa o inglês proibido', () => {
    expect(checkEnglish(collectUserFacingStrings(), rules.forbidden, rules.allowlist)).toEqual([]);
  });
});

describe('goldens executáveis', () => {
  const engine = loadEnglishRules(ROOT_DIR).forbidden.filter((entry) => entry.scope === 'engine');

  it('acha a frase do motor em stdout ou stderr', () => {
    expect(findEnglishHits('x is not a function', engine)).toEqual(['is not a function']);
    expect(findEnglishHits('Bão, sô', engine)).toEqual([]);
  });

  it('falha se o stderr do programa casar a lista do motor', async () => {
    await expect(executeModule('null.x;\n', null)).rejects.toThrow('Cannot read properties');
  });

  it('falha se o stdout do programa casar a lista do motor', async () => {
    await expect(executeModule('console.log("Maximum call stack");\n', null)).rejects.toThrow('Maximum call stack');
  });

  it('deixa passar a saída em goianês', async () => {
    await expect(executeModule('console.log("Bão, sô");\n', null)).resolves.toBe('Bão, sô\n');
  });
});

describe('extractStringLiterals', () => {
  it('lê textos e modelos, e ignora importações, chaves e tipos literais', () => {
    const source = [
      "import { x } from './x.ts';",
      "export const A = { 'chave': 'Bão, sô', other: `Oi ${String(1)} fim`, vazio: '  ' } as const;",
      "export type Tone = 'raiz' | 'neutro';",
    ].join('\n');
    expect(extractStringLiterals(source)).toEqual(['Bão, sô', 'Oi ', ' fim']);
  });
});
