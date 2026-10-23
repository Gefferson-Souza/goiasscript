import { BLOCK_LANGUAGE, DIAGNOSTIC_CODE, ESCAPED_NEWLINE, EXAMPLE_FLAG, EXPECTED_ERROR_FLAG, INPUT_FLAG_PREFIX, SKIP_RUN_FLAG } from './docs-gate.constants.ts';
import type { DocBlock, DocBlockDeps, DocProblem } from './docs-gate.types.ts';
import type { FencedBlock } from './docs-markdown.types.ts';
import { scanMarkdown } from './docs-markdown.ts';

interface Flags {
  readonly expectation: DocBlock['expectation'];
  readonly expectedCode?: string;
  readonly stdin?: string;
}

function unquote(value: string): string {
  return value.startsWith('"') && value.endsWith('"') && value.length > 1 ? value.slice(1, -1) : value;
}

function readFlags(tokens: readonly string[]): Flags {
  const errorAt = tokens.indexOf(EXPECTED_ERROR_FLAG);
  if (errorAt !== -1) return { expectation: 'expected-error', expectedCode: tokens[errorAt + 1] ?? '' };
  const input = tokens.find((token) => token.startsWith(INPUT_FLAG_PREFIX));
  if (tokens.includes(SKIP_RUN_FLAG)) return { expectation: 'compiles-only' };
  if (input === undefined) return { expectation: 'runs' };
  return { expectation: 'runs', stdin: `${unquote(input.slice(INPUT_FLAG_PREFIX.length)).replace(ESCAPED_NEWLINE, '\n')}\n` };
}

function toDocBlock(block: FencedBlock, file: string): DocBlock {
  const base = { file, line: block.line, code: block.code };
  if (block.tokens[0] !== BLOCK_LANGUAGE) return { ...base, expectation: 'misspelled-language' };
  return { ...base, ...readFlags(block.tokens.slice(1).filter((token) => token !== EXAMPLE_FLAG)) };
}

// A info string aceita [entrada=<texto>] [sem-execucao] [erro-esperado GSnnnn] e o `exemplo` da cartilha.
// Idioma que só difere de `goiasscript` na caixa ou colado em texto vira problema em vez de ser ignorado.
export function extractGoiasscriptBlocks(markdown: string, file: string): readonly DocBlock[] {
  return scanMarkdown(markdown)
    .fenced.filter((block) => (block.tokens[0] ?? '').toLowerCase().startsWith(BLOCK_LANGUAGE))
    .map((block) => toDocBlock(block, file));
}

const problem = (block: DocBlock, offset: number, message: string): DocProblem => ({ file: block.file, line: block.line + offset, message });

function checkExpectedError(block: DocBlock, deps: DocBlockDeps): readonly DocProblem[] {
  if (block.expectedCode === undefined || !DIAGNOSTIC_CODE.test(block.expectedCode)) {
    return [problem(block, 0, 'o bloco erro-esperado precisa do código no formato GSnnnn.')];
  }
  const codes = deps.compile(block.code).diagnostics.map((diagnostic) => diagnostic.code);
  if (codes.length > 0 && codes.every((code) => code === block.expectedCode)) return [];
  return [problem(block, 0, `o bloco devia dar ${block.expectedCode}, mas deu ${codes.length === 0 ? 'nada' : codes.join(', ')}.`)];
}

async function checkRuns(block: DocBlock, code: string, deps: DocBlockDeps): Promise<readonly DocProblem[]> {
  const result = await deps.run(code, block.stdin ?? '');
  if (result.timedOut) return [problem(block, 0, 'o bloco estourou o tempo de execução.')];
  if (result.exitCode === 0) return [];
  const detail = result.stderr.trim().split('\n')[0] ?? '';
  return [problem(block, 0, `o bloco terminou com erro (saída ${String(result.exitCode)}): ${detail}. Se ele pergunta algo, ponha entrada=<texto> ou sem-execucao.`)];
}

async function checkRegular(block: DocBlock, deps: DocBlockDeps): Promise<readonly DocProblem[]> {
  const compiled = deps.compile(block.code);
  if (!compiled.ok || compiled.diagnostics.length > 0) {
    if (compiled.diagnostics.length === 0) return [problem(block, 0, 'o bloco não compilou.')];
    return compiled.diagnostics.map((diagnostic) => problem(block, diagnostic.range.start.line, `o bloco não compilou: ${diagnostic.code} (${diagnostic.message}).`));
  }
  return block.expectation === 'runs' ? checkRuns(block, compiled.code, deps) : [];
}

function checkOne(block: DocBlock, deps: DocBlockDeps): Promise<readonly DocProblem[]> | readonly DocProblem[] {
  if (block.expectation === 'misspelled-language') return [problem(block, 0, `a cerca precisa do idioma exatamente "${BLOCK_LANGUAGE}", em minúsculas e separado das opções.`)];
  return block.expectation === 'expected-error' ? checkExpectedError(block, deps) : checkRegular(block, deps);
}

// Sequencial de propósito: cada bloco que roda sobe um processo, e a CI não aguenta todos juntos.
export function checkDocBlocks(blocks: readonly DocBlock[], deps: DocBlockDeps): Promise<readonly DocProblem[]> {
  return blocks.reduce<Promise<readonly DocProblem[]>>(async (previous, block) => {
    const found = await checkOne(block, deps);
    return [...(await previous), ...found];
  }, Promise.resolve([]));
}

export const formatProblem = (item: DocProblem): string => `${item.file}:${String(item.line)}: ${item.message}`;
