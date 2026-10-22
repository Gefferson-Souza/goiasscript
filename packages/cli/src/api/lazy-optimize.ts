import type { CompileSuccess, OptimizeResult } from '@goiasscript/compiler';

// O Terser pesa: só entra na memória quando alguém pede para otimizar.
export async function optimize(result: CompileSuccess, options: { readonly minify: boolean }): Promise<OptimizeResult> {
  const optimizer = await import('@goiasscript/optimizer');
  return optimizer.optimize(result, options);
}
