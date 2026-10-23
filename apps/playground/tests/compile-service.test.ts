import { compile as realCompile, type CompileOptions, type CompileSuccess } from '@goiasscript/compiler';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { MARKER_SEVERITY } from '../lib/diagnostic-markers.constants.ts';
import { createCompileService } from '../lib/compile-service.ts';
import type { OptimizerModule } from '../lib/compile-service.types.ts';

const OPTIMIZED_MARK = '/* otimizado */';

function fakeOptimizer(): { readonly module: OptimizerModule; readonly optimize: Mock<OptimizerModule['optimize']> } {
  const optimize = vi.fn<OptimizerModule['optimize']>((result: CompileSuccess) => Promise.resolve({ code: `${OPTIMIZED_MARK}${result.code}`, map: null }));
  return { module: { optimize }, optimize };
}

describe('createCompileService', () => {
  it('compila no modo didático e devolve o JS gerado', async () => {
    const loadOptimizer = vi.fn();
    const service = createCompileService({ tone: 'raiz', loadOptimizer });
    const view = await service.compile('prosa("oi")', 'didactic');
    expect(view.result.ok).toBe(true);
    expect(view.generatedCode).toContain('console.log');
    expect(view.markers).toEqual([]);
    expect(loadOptimizer).not.toHaveBeenCalled();
  });

  it('programa com erro devolve marcadores e nenhum JS', async () => {
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn() });
    const view = await service.compile('uai x é', 'didactic');
    expect(view.result.ok).toBe(false);
    expect(view.markers.length).toBeGreaterThanOrEqual(1);
    expect(view.generatedCode).toBeNull();
    expect(view.hiddenMarkerCount).toBe(0);
  });

  it('só carrega o otimizador ao pedir "otimizado" e reaproveita a promessa', async () => {
    const { module, optimize } = fakeOptimizer();
    const loadOptimizer = vi.fn(() => Promise.resolve(module));
    const service = createCompileService({ tone: 'raiz', loadOptimizer });
    await service.compile('prosa(1)', 'didactic');
    expect(loadOptimizer).not.toHaveBeenCalled();
    const first = await service.compile('prosa(1)', 'optimized');
    await service.compile('prosa(2)', 'optimized');
    expect(loadOptimizer).toHaveBeenCalledTimes(1);
    expect(optimize).toHaveBeenCalledTimes(2);
    expect(first.generatedCode?.startsWith(OPTIMIZED_MARK)).toBe(true);
  });

  it('falha ao carregar o otimizador mantém o JS didático e avisa em goianês', async () => {
    const loadOptimizer = vi.fn(() => Promise.reject(new Error('rede caiu')));
    const service = createCompileService({ tone: 'raiz', loadOptimizer });
    const view = await service.compile('prosa("oi")', 'optimized');
    expect(view.generatedCode).toContain('console.log');
    expect(view.markers).toHaveLength(1);
    expect(view.markers[0]?.severity).toBe(MARKER_SEVERITY.warning);
    expect(view.markers[0]?.message).toContain('sô');
  });

  it('falha do próprio otimizador também cai no didático sem lançar', async () => {
    const module: OptimizerModule = { optimize: () => Promise.reject(new Error('terser quebrou')) };
    const service = createCompileService({ tone: 'raiz', loadOptimizer: () => Promise.resolve(module) });
    const view = await service.compile('prosa("oi")', 'optimized');
    expect(view.generatedCode).toContain('console.log');
    expect(view.markers).toHaveLength(1);
  });

  it('tenta de novo o carregamento depois de uma falha', async () => {
    const { module } = fakeOptimizer();
    const loadOptimizer = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValue(module);
    const service = createCompileService({ tone: 'raiz', loadOptimizer });
    await service.compile('prosa(1)', 'optimized');
    const second = await service.compile('prosa(2)', 'optimized');
    expect(second.generatedCode?.startsWith(OPTIMIZED_MARK)).toBe(true);
    expect(loadOptimizer).toHaveBeenCalledTimes(2);
  });

  it('compila com o alvo playground, loopLimit, mapa de fonte e o tom pedido', async () => {
    const compile = vi.fn((source: string, options?: CompileOptions) => realCompile(source, options));
    const service = createCompileService({ tone: 'neutro', loadOptimizer: vi.fn(), compile });
    await service.compile('prosa(1)', 'didactic');
    expect(compile).toHaveBeenCalledWith('prosa(1)', expect.objectContaining({ target: 'playground', loopLimit: RUN_LIMITS.loopLimit, sourceMap: true, tone: 'neutro' }));
  });

  it('entrada idêntica à anterior devolve o mesmo objeto', async () => {
    const compile = vi.fn((source: string, options?: CompileOptions) => realCompile(source, options));
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), compile });
    const first = await service.compile('prosa(1)', 'didactic');
    const second = await service.compile('prosa(1)', 'didactic');
    expect(second).toBe(first);
    expect(compile).toHaveBeenCalledTimes(1);
    const other = await service.compile('prosa(1)', 'optimized').catch(() => null);
    expect(other).not.toBe(first);
  });

  it('não memoriza o resultado de fallback do otimizador', async () => {
    const { module } = fakeOptimizer();
    const loadOptimizer = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValue(module);
    const service = createCompileService({ tone: 'raiz', loadOptimizer });
    const first = await service.compile('prosa(1)', 'optimized');
    const second = await service.compile('prosa(1)', 'optimized');
    expect(first.markers).toHaveLength(1);
    expect(second.markers).toEqual([]);
    expect(second.generatedCode?.startsWith(OPTIMIZED_MARK)).toBe(true);
  });

  it('não memoriza rejeição quando o compilador lança', async () => {
    const compile = vi.fn<typeof realCompile>().mockImplementationOnce(() => {
      throw new Error('boom');
    });
    compile.mockImplementation((source, options) => realCompile(source, options));
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), compile });
    await expect(service.compile('prosa(1)', 'didactic')).rejects.toThrow('boom');
    const retry = await service.compile('prosa(1)', 'didactic');
    expect(retry.result.ok).toBe(true);
  });
});
