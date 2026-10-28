import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const RESOLVE_DIR = fileURLToPath(new URL('../..', import.meta.url));
const BUNDLE_TIMEOUT_MS = 60_000;

async function inputsOf(contents: string): Promise<readonly string[]> {
  const { metafile } = await build({
    stdin: { contents, resolveDir: RESOLVE_DIR, loader: 'ts' },
    bundle: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent',
  });
  return Object.values(metafile.outputs).flatMap((output) => Object.entries(output.inputs).filter(([, usage]) => usage.bytesInOutput > 0).map(([path]) => path));
}

describe('entrada do núcleo', () => {
  it('não empacota o texto dos diagnósticos', async () => {
    const inputs = await inputsOf("export { compileCore, translateRuntimeErrorCore } from '@goiasscript/compiler/core';");
    expect(inputs.filter((input) => /diagnostics\/[\w-]+\.data\.ts$/u.test(input))).toEqual([]);
    expect(inputs.some((input) => input.endsWith('completions.ts'))).toBe(false);
  }, BUNDLE_TIMEOUT_MS);
  it('a entrada de formatação traz o catálogo', async () => {
    const inputs = await inputsOf("export { formatDiagnostic } from '@goiasscript/compiler/format';");
    expect(inputs.some((input) => input.endsWith('names.data.ts'))).toBe(true);
  }, BUNDLE_TIMEOUT_MS);
});
