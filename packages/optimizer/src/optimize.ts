import type { CompileSuccess, OptimizeResult } from '@goiasscript/compiler';
import { minify as terserMinify } from 'terser';

const ECMA_2022 = 2022;
const OUTPUT_FILE_NAME = 'saida.mjs';

// `module: true` liga o modo de módulo do Terser: sem ele o `await` de topo não parseia.
export async function optimize(result: CompileSuccess, options: { readonly minify: boolean }): Promise<OptimizeResult> {
  const output = await terserMinify(result.code, {
    ecma: ECMA_2022,
    module: true,
    compress: { ecma: ECMA_2022 },
    mangle: options.minify,
    ...(result.map ? { sourceMap: { content: JSON.stringify(result.map), filename: OUTPUT_FILE_NAME } } : {}),
  });
  if (output.code === undefined) throw new Error('o terser não devolveu código');
  return { code: output.code, map: result.map && output.map ? toSourceMap(output.map) : null };
}

function toSourceMap(map: string | object): OptimizeResult['map'] {
  return (typeof map === 'string' ? JSON.parse(map) : map) as OptimizeResult['map'];
}
