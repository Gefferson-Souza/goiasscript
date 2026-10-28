import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const ENTRY_RESOLVE_DIR = fileURLToPath(new URL('..', import.meta.url));
// O caminho crítico do playground: o núcleo, sem o texto dos diagnósticos (que vai num módulo à parte).
const CORE_ENTRY_CONTENTS = "export { compileCore, translateRuntimeErrorCore } from '@goiasscript/compiler/core';";
const FORMAT_ENTRY_CONTENTS = "export { formatCompileResult, formatDiagnostic } from '@goiasscript/compiler/format';";
const entryOptions = { stdin: { contents: CORE_ENTRY_CONTENTS, resolveDir: ENTRY_RESOLVE_DIR, loader: 'ts' as const } };
const FORMAT_CHUNK_INFORMATIVE_CEILING_BYTES = 8 * 1024;
const ADR_CEILING_BYTES = 29_696;
const ENCODER_JITTER_BYTES = 64;
const SOURCE_DIRECTORIES = ['lib', 'components', 'app', 'hooks', 'sandbox'];
const TYPE_IMPORT = /^\s*(?:import|export)\s+type\b/u;
const MAIN_ENTRY_SPECIFIER = "'@goiasscript/compiler'";
const BUDGETS_FILE = new URL('../budgets.json', import.meta.url);
const BUNDLE_TIMEOUT_MS = 60_000;

async function measureBrotliBytes(contents: string): Promise<number> {
  const { outputFiles } = await build({
    stdin: { contents, resolveDir: ENTRY_RESOLVE_DIR, loader: 'ts' },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    legalComments: 'none',
    logLevel: 'silent',
  });
  const bundle = outputFiles[0]?.contents;
  if (bundle === undefined) throw new Error('o esbuild não gerou saída');
  return brotliCompressSync(bundle, { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } }).byteLength;
}

function listSources(directory: string): readonly string[] {
  const root = fileURLToPath(new URL(`../${directory}`, import.meta.url));
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((name) => /\.tsx?$/u.test(name)).map((name) => join(root, name));
}

describe('orçamento do chunk do compilador', () => {
  it('budgets.json guarda o teto do ADR-0001 (29 KB), não o valor medido', () => {
    const budgets = JSON.parse(readFileSync(BUDGETS_FILE, 'utf8')) as { readonly compilerChunkBrotliBytes: number };
    expect(budgets.compilerChunkBrotliBytes).toBe(ADR_CEILING_BYTES);
  });

  it('o núcleo não passa dos bytes brotli do teto em budgets.json', async () => {
    const budgets = JSON.parse(readFileSync(BUDGETS_FILE, 'utf8')) as { readonly compilerChunkBrotliBytes: number };
    const measured = await measureBrotliBytes(CORE_ENTRY_CONTENTS);
    expect(measured, `estourou: medido ${String(measured)} B contra o teto de ${String(budgets.compilerChunkBrotliBytes)} B`).toBeLessThanOrEqual(budgets.compilerChunkBrotliBytes);
  }, BUNDLE_TIMEOUT_MS);

  it('o núcleo não cresce nem encolhe além da catraca interna (coreRatchetBytes)', async () => {
    const budgets = JSON.parse(readFileSync(BUDGETS_FILE, 'utf8')) as { readonly coreRatchetBytes: number };
    const measured = await measureBrotliBytes(CORE_ENTRY_CONTENTS);
    expect(measured, `subiu: medido ${String(measured)} B contra ${String(budgets.coreRatchetBytes)} B na catraca`).toBeLessThanOrEqual(budgets.coreRatchetBytes);
    expect(
      budgets.coreRatchetBytes - measured,
      `melhorou: atualize budgets.json para { "coreRatchetBytes": ${String(measured)} }`,
    ).toBeLessThanOrEqual(ENCODER_JITTER_BYTES);
  }, BUNDLE_TIMEOUT_MS);

  it('o módulo de mensagens, baixado só com diagnóstico, fica abaixo do teto informativo', async () => {
    expect(await measureBrotliBytes(FORMAT_ENTRY_CONTENTS)).toBeLessThanOrEqual(FORMAT_CHUNK_INFORMATIVE_CEILING_BYTES);
  }, BUNDLE_TIMEOUT_MS);

  it('o código do playground só importa tipos da entrada principal do compilador', () => {
    const offenders = SOURCE_DIRECTORIES.flatMap(listSources).filter((file) =>
      readFileSync(file, 'utf8').split('\n').some((line) => line.includes(MAIN_ENTRY_SPECIFIER) && !TYPE_IMPORT.test(line)),
    );
    expect(offenders).toEqual([]);
  });

  it('o bundle do serviço não puxa o otimizador', async () => {
    const { metafile } = await build({ ...entryOptions, bundle: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent' });
    const inputs = Object.keys(metafile.inputs);
    expect(inputs.some((input) => input.includes('optimizer') || input.includes('terser'))).toBe(false);
  }, BUNDLE_TIMEOUT_MS);
});
