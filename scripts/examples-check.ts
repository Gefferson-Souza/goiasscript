import fs from 'node:fs';
import path from 'node:path';
import { EXAMPLE_INPUT_FILE, EXAMPLE_OUTPUT_FILE, EXAMPLE_SOURCE_FILE, EXAMPLES_DIR, LINE_BREAK, NO_INPUT, WHOLE_FILE_LINE } from './docs-gate.constants.ts';
import type { DocBlockDeps, DocProblem, ExampleProgram } from './docs-gate.types.ts';

const readOptional = (file: string): string => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : NO_INPUT);

function readExample(root: string, name: string): ExampleProgram {
  const dir = path.join(root, EXAMPLES_DIR, name);
  const outputFile = path.join(dir, EXAMPLE_OUTPUT_FILE);
  if (!fs.existsSync(outputFile)) throw new Error(`Ô sô, o exemplo "${name}" não tem ${EXAMPLE_OUTPUT_FILE} com a saída esperada.`);
  return {
    name,
    file: [EXAMPLES_DIR, name, EXAMPLE_SOURCE_FILE].join('/'),
    source: fs.readFileSync(path.join(dir, EXAMPLE_SOURCE_FILE), 'utf8'),
    stdin: readOptional(path.join(dir, EXAMPLE_INPUT_FILE)),
    expectedStdout: fs.readFileSync(outputFile, 'utf8'),
  };
}

export function readExamples(root: string): readonly ExampleProgram[] {
  const base = path.join(root, EXAMPLES_DIR);
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(base, entry.name, EXAMPLE_SOURCE_FILE)))
    .map((entry) => entry.name)
    .sort()
    .map((name) => readExample(root, name));
}

function outputProblem(example: ExampleProgram, stdout: string): readonly DocProblem[] {
  if (stdout === example.expectedStdout) return [];
  const actual = stdout.split(LINE_BREAK);
  const expected = example.expectedStdout.split(LINE_BREAK);
  const index = expected.findIndex((line, at) => line !== actual[at]);
  const at = index === -1 ? expected.length : index;
  const message = `a linha ${String(at + 1)} da saída devia ser "${expected[at] ?? ''}", mas saiu "${actual[at] ?? ''}".`;
  return [{ file: example.file, line: at + 1, message }];
}

async function checkExample(example: ExampleProgram, deps: DocBlockDeps): Promise<readonly DocProblem[]> {
  const compiled = deps.compile(example.source);
  if (!compiled.ok) {
    const codes = compiled.diagnostics.map((item) => item.code).join(', ');
    return [{ file: example.file, line: WHOLE_FILE_LINE, message: `o exemplo não compila: ${codes}.` }];
  }
  const result = await deps.run(compiled.code, example.stdin);
  if (result.exitCode !== 0) {
    const message = `o exemplo terminou com erro (saída ${String(result.exitCode)}): ${result.stderr.trim()}`;
    return [{ file: example.file, line: WHOLE_FILE_LINE, message }];
  }
  return outputProblem(example, result.stdout);
}

export async function checkExamples(examples: readonly ExampleProgram[], deps: DocBlockDeps): Promise<readonly DocProblem[]> {
  const results = await Promise.all(examples.map((example) => checkExample(example, deps)));
  return results.flat();
}
