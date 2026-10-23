import { describe, expect, it } from 'vitest';
import { compile } from '../../../packages/compiler/src/index.ts';
import { checkDocBlocks, extractGoiasscriptBlocks, formatProblem } from '../../../scripts/docs-blocks.ts';
import type { DocBlockDeps, DocRunResult } from '../../../scripts/docs-gate.types.ts';

const OK_RUN: DocRunResult = { stdout: '', stderr: '', exitCode: 0, timedOut: false };

function depsRecording(stdins: string[], result: DocRunResult = OK_RUN): DocBlockDeps {
  return {
    compile: (source) => compile(source, { target: 'module' }),
    run: (_code, stdin) => {
      stdins.push(stdin);
      return Promise.resolve(result);
    },
  };
}

const fence = (info: string, body: string): string => `texto\n\n\`\`\`goiasscript${info}\n${body}\n\`\`\`\n`;

describe('extractGoiasscriptBlocks', () => {
  it('extrai blocos goiasscript com linha e flags', () => {
    const markdown = fence('', 'prosa("a")') + fence(' sem-execucao', 'prosa("b")') + fence(' erro-esperado GS0301', 'prosa(x)') + fence(' entrada=Maria', 'prosa("c")');
    const blocks = extractGoiasscriptBlocks(markdown, 'README.md');
    expect(blocks.map((block) => block.expectation)).toEqual(['runs', 'compiles-only', 'expected-error', 'runs']);
    expect(blocks.map((block) => block.line)).toEqual([3, 8, 13, 18]);
    expect(blocks[2]?.expectedCode).toBe('GS0301');
    expect(blocks[3]?.stdin).toBe('Maria\n');
    expect(blocks[0]?.file).toBe('README.md');
  });

  it('ignora blocos de outras linguagens', () => {
    const markdown = '```bash\ngoiasscript traduz a.gs\n```\n\n```ebnf\nprograma = { comando } ;\n```\n\n````markdown\n```goiasscript\nprosa(1)\n```\n````\n';
    expect(extractGoiasscriptBlocks(markdown, 'a.md')).toEqual([]);
  });

  it('aceita a entrada entre aspas com quebra de linha escapada', () => {
    const blocks = extractGoiasscriptBlocks(fence(' entrada="Ana\\n42"', 'prosa(1)'), 'a.md');
    expect(blocks[0]?.stdin).toBe('Ana\n42\n');
  });

  it('trata o exemplo da cartilha como bloco que executa', () => {
    expect(extractGoiasscriptBlocks(fence(' exemplo', 'prosa(1)'), 'licao-01.md')[0]?.expectation).toBe('runs');
  });
});

describe('checkDocBlocks', () => {
  it('passa para bloco que compila e executa', async () => {
    const blocks = extractGoiasscriptBlocks(fence('', 'prosa("oi")'), 'README.md');
    expect(await checkDocBlocks(blocks, depsRecording([]))).toEqual([]);
  });

  it('bloco que não compila falha com arquivo e linha', async () => {
    const blocks = extractGoiasscriptBlocks(fence('', 'prosa(naoExiste)'), 'docs/guia.md');
    const problems = await checkDocBlocks(blocks, depsRecording([]));
    expect(problems).toHaveLength(1);
    expect(formatProblem(problems[0] as never)).toMatch(/^docs\/guia\.md:\d+: o bloco não compilou: GS0301/u);
  });

  it('bloco com entrada alimenta o stdin', async () => {
    const stdins: string[] = [];
    const blocks = extractGoiasscriptBlocks(fence(' entrada=Maria', 'uai nome é pergunta("Nome?")'), 'README.md');
    await checkDocBlocks(blocks, depsRecording(stdins));
    expect(stdins).toEqual(['Maria\n']);
  });

  it('falha quando o programa termina com erro ou estoura o tempo', async () => {
    const blocks = extractGoiasscriptBlocks(fence('', 'prosa(1)'), 'a.md');
    const failed = await checkDocBlocks(blocks, depsRecording([], { stdout: '', stderr: 'boom\nresto', exitCode: 1, timedOut: false }));
    const slow = await checkDocBlocks(blocks, depsRecording([], { stdout: '', stderr: '', exitCode: null, timedOut: true }));
    expect(failed[0]?.message).toContain('terminou com erro (saída 1): boom');
    expect(slow[0]?.message).toContain('estourou o tempo');
  });

  it('erro-esperado exige o código exato', async () => {
    const exact = extractGoiasscriptBlocks(fence(' erro-esperado GS0301', 'prosa(naoExiste)'), 'a.md');
    const wrong = extractGoiasscriptBlocks(fence(' erro-esperado GS0999', 'prosa(naoExiste)'), 'a.md');
    const clean = extractGoiasscriptBlocks(fence(' erro-esperado GS0301', 'prosa(1)'), 'a.md');
    const malformed = extractGoiasscriptBlocks(fence(' erro-esperado', 'prosa(1)'), 'a.md');
    expect(await checkDocBlocks(exact, depsRecording([]))).toEqual([]);
    expect((await checkDocBlocks(wrong, depsRecording([])))[0]?.message).toContain('devia dar GS0999, mas deu GS0301');
    expect((await checkDocBlocks(clean, depsRecording([])))[0]?.message).toContain('mas deu nada');
    expect((await checkDocBlocks(malformed, depsRecording([])))[0]?.message).toContain('GSnnnn');
  });

  it('sem-execucao só compila', async () => {
    const stdins: string[] = [];
    const blocks = extractGoiasscriptBlocks(fence(' sem-execucao', 'prosa("oi")'), 'a.md');
    expect(await checkDocBlocks(blocks, depsRecording(stdins))).toEqual([]);
    expect(stdins).toEqual([]);
  });
});
