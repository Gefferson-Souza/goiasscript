import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { optimize } from '../src/api/lazy-optimize.ts';

describe('optimize da API', () => {
  it('carrega o otimizador sob demanda e devolve o código enxuto', async () => {
    const result = compile('uai x é 1 mais 2\nprosa(x)\n');
    if (!result.ok) throw new Error('programa de teste deveria compilar');
    const optimized = await optimize(result, { minify: true });
    expect(optimized.code.length).toBeGreaterThan(0);
    expect(optimized.code.length).toBeLessThanOrEqual(result.code.length);
  });
});
