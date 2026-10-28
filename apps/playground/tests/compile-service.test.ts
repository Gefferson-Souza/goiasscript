import type { CompileSuccess } from '@goiasscript/compiler';
import { compileCore as realCompile } from '@goiasscript/compiler/core';
import { formatCompileResult } from '@goiasscript/compiler/format';
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
    const compile = vi.fn((source: string, options?: Parameters<typeof realCompile>[1]) => realCompile(source, options));
    const service = createCompileService({ tone: 'neutro', loadOptimizer: vi.fn(), loadCompile: () => Promise.resolve(compile) });
    await service.compile('prosa(1)', 'didactic');
    expect(compile).toHaveBeenCalledWith('prosa(1)', expect.objectContaining({ target: 'playground', loopLimit: RUN_LIMITS.loopLimit, sourceMap: true, tone: 'neutro' }));
  });

  it('entrada idêntica à anterior devolve o mesmo objeto', async () => {
    const compile = vi.fn((source: string, options?: Parameters<typeof realCompile>[1]) => realCompile(source, options));
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadCompile: () => Promise.resolve(compile) });
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
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadCompile: () => Promise.resolve(compile) });
    await expect(service.compile('prosa(1)', 'didactic')).rejects.toThrow('boom');
    const retry = await service.compile('prosa(1)', 'didactic');
    expect(retry.result.ok).toBe(true);
  });

  it('só carrega o compilador na primeira compilação e reaproveita o módulo', async () => {
    const loadCompile = vi.fn(() => Promise.resolve((source: string, options?: Parameters<typeof realCompile>[1]) => realCompile(source, options)));
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadCompile });
    expect(loadCompile).not.toHaveBeenCalled();
    await service.compile('prosa(1)', 'didactic');
    await service.compile('prosa(2)', 'didactic');
    expect(loadCompile).toHaveBeenCalledTimes(1);
  });

  it('falha ao carregar o compilador não fica guardada e a próxima tentativa recarrega', async () => {
    const loadCompile = vi
      .fn<() => Promise<typeof realCompile>>()
      .mockRejectedValueOnce(new Error('chunk perdido'))
      .mockResolvedValue((source: string, options?: Parameters<typeof realCompile>[1]) => realCompile(source, options));
    const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadCompile });
    await expect(service.compile('prosa(1)', 'didactic')).rejects.toThrow('chunk perdido');
    const view = await service.compile('prosa(1)', 'didactic');
    expect(view.result.ok).toBe(true);
    expect(loadCompile).toHaveBeenCalledTimes(2);
  });

  describe('módulo de mensagens', () => {
    const realFormatter = (result: Parameters<typeof formatCompileResult>[0], tone: Parameters<typeof formatCompileResult>[1]) => formatCompileResult(result, tone);

    it('programa sem diagnóstico nunca carrega as mensagens', async () => {
      const loadFormatter = vi.fn(() => Promise.resolve(realFormatter));
      const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadFormatter });
      const view = await service.compile('prosa(1)', 'didactic');
      expect(view.result.ok).toBe(true);
      expect(loadFormatter).not.toHaveBeenCalled();
    });

    it('com diagnóstico carrega as mensagens uma vez só e entrega o texto', async () => {
      const loadFormatter = vi.fn(() => Promise.resolve(realFormatter));
      const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadFormatter });
      const first = await service.compile('uai x é', 'didactic');
      await service.compile('uai y é', 'didactic');
      expect(loadFormatter).toHaveBeenCalledTimes(1);
      expect(first.result.diagnostics[0]?.message).not.toBe(first.result.diagnostics[0]?.code);
      expect(first.markers[0]?.message).toContain('sô');
    });

    it('respeita o tom pedido ao formatar', async () => {
      const formatter = vi.fn(realFormatter);
      const service = createCompileService({ tone: 'neutro', loadOptimizer: vi.fn(), loadFormatter: () => Promise.resolve(formatter) });
      await service.compile('uai x é', 'didactic');
      expect(formatter).toHaveBeenCalledWith(expect.anything(), 'neutro');
    });

    it('entrega o mesmo texto que a entrada principal do compilador', async () => {
      const { compile } = await import('@goiasscript/compiler');
      const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn() });
      const view = await service.compile('uai a é nomi\nprosa(nome)', 'didactic');
      expect(view.result.diagnostics).toEqual(compile('uai a é nomi\nprosa(nome)', { target: 'playground', tone: 'raiz', fileName: 'programa.gs' }).diagnostics);
    });

    it('falha ao carregar as mensagens mantém o marcador, avisa em goianês e tenta de novo depois', async () => {
      const loadFormatter = vi.fn<() => Promise<typeof realFormatter>>().mockRejectedValueOnce(new Error('chunk perdido')).mockResolvedValue(realFormatter);
      const service = createCompileService({ tone: 'raiz', loadOptimizer: vi.fn(), loadFormatter });
      const failed = await service.compile('uai x é', 'didactic');
      expect(failed.result.ok).toBe(false);
      expect(failed.markers.length).toBeGreaterThanOrEqual(1);
      expect(failed.markers[0]?.message).toContain('Ô sô');
      const retry = await service.compile('uai x é', 'didactic');
      expect(retry).not.toBe(failed);
      expect(retry.markers[0]?.message).not.toBe(failed.markers[0]?.message);
      expect(loadFormatter).toHaveBeenCalledTimes(2);
    });
  });
});
