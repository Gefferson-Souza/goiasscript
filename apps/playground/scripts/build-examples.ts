import { compile } from '@goiasscript/compiler';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYGROUND_FILE_NAME } from '../lib/compile-service.constants.ts';
import { EXAMPLE_ID_PATTERN, EXAMPLES_MANIFEST_FILE } from '../lib/examples.constants.ts';
import type { ExampleEntry } from '../lib/examples.types.ts';
import type { BuildExamplesOptions, ExampleIndexEntry, ExamplesIo } from './build-examples.types.ts';

const INDEX_FILE = 'index.json';

function readIndex(sourceDir: string): readonly ExampleIndexEntry[] {
  const parsed: unknown = JSON.parse(readFileSync(join(sourceDir, INDEX_FILE), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`Ô sô, o ${INDEX_FILE} dos exemplos precisa ser uma lista.`);
  return parsed.map((item: unknown) => {
    const { id, title } = (item ?? {}) as Readonly<Record<string, unknown>>;
    if (typeof id !== 'string' || typeof title !== 'string' || !EXAMPLE_ID_PATTERN.test(id)) {
      throw new Error(`Ô sô, entrada torta no ${INDEX_FILE} dos exemplos: ${JSON.stringify(item)}.`);
    }
    return { id, title };
  });
}

function compileExample(entry: ExampleIndexEntry, sourceDir: string): ExampleEntry & { readonly source: string } {
  const file = `${entry.id}.gs`;
  const source = readFileSync(join(sourceDir, file), 'utf8');
  const result = compile(source, { target: 'playground', tone: 'raiz', fileName: PLAYGROUND_FILE_NAME });
  if (!result.ok) {
    const first = result.diagnostics[0];
    throw new Error(`Ô sô, o exemplo "${entry.id}" não compila: ${first === undefined ? 'sem detalhe' : `${first.code} ${first.message}`}`);
  }
  return { ...entry, file, source };
}

// Só escreve depois de compilar todos: build quebrado não deixa saída pela metade.
export function buildExamples(options: BuildExamplesOptions): readonly ExampleEntry[] {
  const compiled = readIndex(options.sourceDir).map((entry) => compileExample(entry, options.sourceDir));
  mkdirSync(options.outDir, { recursive: true });
  for (const example of compiled) writeFileSync(join(options.outDir, example.file), example.source);
  const manifest = compiled.map(({ id, title, file }) => ({ id, title, file }));
  writeFileSync(join(options.outDir, EXAMPLES_MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function runBuildExamples(options: BuildExamplesOptions, io: ExamplesIo): number {
  try {
    const manifest = buildExamples(options);
    io.out(`Tá pronto, sô! ${String(manifest.length)} exemplo(s) moído(s).\n`);
    return 0;
  } catch (error) {
    io.err(`${error instanceof Error ? error.message : 'Ô sô, deu ruim nos exemplos.'}\n`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const appRoot = join(import.meta.dirname, '..');
  const exitCode = runBuildExamples(
    { sourceDir: join(appRoot, 'examples'), outDir: join(appRoot, 'public', 'examples') },
    { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) },
  );
  process.exit(exitCode);
}
