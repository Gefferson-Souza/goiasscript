import { readFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const ENTRY = fileURLToPath(new URL('../lib/compile-service.ts', import.meta.url));
const BUDGETS_FILE = new URL('../budgets.json', import.meta.url);
const BUNDLE_TIMEOUT_MS = 60_000;
// O codificador do brotli varia um pouco entre versões do Node; melhoria menor que isto não exige atualizar o arquivo.
const ENCODER_JITTER_BYTES = 64;

async function measureCompilerChunkBrotliBytes(): Promise<number> {
  const { outputFiles } = await build({
    entryPoints: [ENTRY],
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

describe('orçamento do chunk do compilador', () => {
  it('não passa dos bytes brotli registrados em budgets.json (catraca)', async () => {
    const budgets = JSON.parse(readFileSync(BUDGETS_FILE, 'utf8')) as { readonly compilerChunkBrotliBytes: number };
    const measured = await measureCompilerChunkBrotliBytes();
    expect(measured, `subiu: medido ${String(measured)} B contra ${String(budgets.compilerChunkBrotliBytes)} B registrados`).toBeLessThanOrEqual(budgets.compilerChunkBrotliBytes);
    expect(
      budgets.compilerChunkBrotliBytes - measured,
      `melhorou: atualize budgets.json para { "compilerChunkBrotliBytes": ${String(measured)} }`,
    ).toBeLessThanOrEqual(ENCODER_JITTER_BYTES);
  }, BUNDLE_TIMEOUT_MS);

  it('o bundle do serviço não puxa o otimizador', async () => {
    const { metafile } = await build({ entryPoints: [ENTRY], bundle: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent' });
    const inputs = Object.keys(metafile.inputs);
    expect(inputs.some((input) => input.includes('optimizer') || input.includes('terser'))).toBe(false);
  }, BUNDLE_TIMEOUT_MS);
});
