import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkDocCommands, extractCommandMentions } from '../../../scripts/docs-commands.ts';
import type { CommandRegistry } from '../../../scripts/docs-gate.types.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const readText = (relative: string): string => fs.readFileSync(path.join(ROOT_DIR, relative), 'utf8');

const REGISTRY: CommandRegistry = {
  commands: new Set(['traduz', 'vê_se_tá_certo', 've_se_ta_certo']),
  flags: new Set(['--version']),
  binaries: new Set(['goiasscript', 'goias']),
  languageWords: new Set(['uai', 'prosa']),
  allowlist: [{ word: 'main', reason: 'nome da branch principal' }],
};
const WORD_FILES = new Set(['README.md']);
const doc = (text: string): readonly { file: string; text: string }[] => [{ file: 'README.md', text }];

describe('extractCommandMentions', () => {
  it('lê comandos de código inline e de blocos de shell, e palavras soltas', () => {
    const mentions = extractCommandMentions('Rode `goiasscript traduz a.gs` e `uai`.\n\n```bash\n$ goiasscript vê_se_tá_certo a.gs\n```\n');
    expect(mentions.commands).toEqual(['traduz', 'vê_se_tá_certo']);
    expect(mentions.words).toEqual(['uai']);
  });
});

describe('checkDocCommands', () => {
  it('comando inexistente falha', () => {
    const problems = checkDocCommands(doc('Rode `goiasscript voa a.gs`.'), REGISTRY, WORD_FILES);
    expect(problems).toEqual([{ file: 'README.md', line: 1, message: 'o comando "goiasscript voa" não existe no CLI.' }]);
  });

  it('palavra citada fora da tabela e da lista de permissão falha', () => {
    const problems = checkDocCommands(doc('Use `uai`, `main` e `inventada`.'), REGISTRY, WORD_FILES);
    expect(problems.map((item) => item.message)).toEqual(['a palavra "inventada" citada em código não está na tabela da linguagem nem na lista de permissão.']);
  });

  it('entrada da lista de permissão sem razão falha', () => {
    const registry = { ...REGISTRY, allowlist: [{ word: 'main', reason: '  ' }] };
    const problems = checkDocCommands([], registry, WORD_FILES);
    expect(problems[0]?.message).toContain('sem razão');
  });

  it('comando com acento e sem acento passa', () => {
    const text = 'Rode `goiasscript vê_se_tá_certo a.gs` ou `goiasscript ve_se_ta_certo a.gs`, ou ainda `goiasscript --version`.';
    expect(checkDocCommands(doc(text), REGISTRY, WORD_FILES)).toEqual([]);
  });

  it('aceita acento decomposto, marcador de posição e o nome do binário', () => {
    const text = 'Rode `goiasscript vê_se_tá_certo a.gs`, `goiasscript <comando>` e `goias`.';
    expect(checkDocCommands(doc(text), REGISTRY, WORD_FILES)).toEqual([]);
  });

  it('não confere palavras de arquivos fora da lista de documentos de palavras', () => {
    const files = [{ file: 'docs/guia.md', text: 'Veja `inventada`.' }];
    expect(checkDocCommands(files, REGISTRY, WORD_FILES)).toEqual([]);
  });
});

describe('configuração do gate', () => {
  it('promises-gate roda os dois jobs', () => {
    const workflow = readText('.github/workflows/promises-gate.yml');
    expect(workflow).toMatch(/^ {2}docs-blocks:/mu);
    expect(workflow).toMatch(/^ {2}docs-commands:/mu);
    expect(workflow).toContain('pnpm docs:blocks');
    expect(workflow).toContain('pnpm docs:commands');
  });

  it('o verify da raiz roda os dois scripts', () => {
    const manifest = JSON.parse(readText('package.json')) as { readonly scripts: Readonly<Record<string, string>> };
    expect(manifest.scripts['verify']).toContain('scripts/check-docs-blocks.ts');
    expect(manifest.scripts['verify']).toContain('scripts/check-docs-commands.ts');
    expect(manifest.scripts['docs:blocks']).toContain('scripts/check-docs-blocks.ts');
    expect(manifest.scripts['docs:commands']).toContain('scripts/check-docs-commands.ts');
  });

  it('a lista de permissão real tem razão em toda entrada', () => {
    const entries = JSON.parse(readText('tools/promises/word-allowlist.json')) as readonly { readonly word: string; readonly reason: string }[];
    expect(entries.filter((entry) => entry.reason.trim() === '')).toEqual([]);
  });
});
