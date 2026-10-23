import { describe, expect, it, vi } from 'vitest';
import { EDITOR_UNICODE_HIGHLIGHT, GOIASSCRIPT_LANGUAGE_ID, MARKER_OWNER } from '../lib/monaco/monaco-assets.ts';
import { registerGoiasScript } from '../lib/monaco/register-language.ts';
import type { MonacoLike } from '../lib/monaco/monaco-api.types.ts';

function fakeMonaco(): { readonly monaco: MonacoLike; readonly calls: Record<string, ReturnType<typeof vi.fn>> } {
  const calls = {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    registerHoverProvider: vi.fn(),
  };
  return { monaco: { languages: calls }, calls };
}

describe('registerGoiasScript', () => {
  it('registra a linguagem, o tokenizador, o autocomplete e o hover uma vez só', () => {
    const { monaco, calls } = fakeMonaco();
    registerGoiasScript(monaco);
    registerGoiasScript(monaco);
    expect(calls.register).toHaveBeenCalledTimes(1);
    expect(calls.register).toHaveBeenCalledWith({ id: GOIASSCRIPT_LANGUAGE_ID });
    expect(calls.setMonarchTokensProvider).toHaveBeenCalledWith(GOIASSCRIPT_LANGUAGE_ID, expect.objectContaining({ unicode: true }));
    expect(calls.registerCompletionItemProvider).toHaveBeenCalledTimes(1);
    expect(calls.registerHoverProvider).toHaveBeenCalledTimes(1);
  });

  it('o dono dos marcadores é goiasscript', () => {
    expect(MARKER_OWNER).toBe('goiasscript');
  });

  it('o editor não destaca acento nem letra parecida como suspeita', () => {
    expect(Object.values(EDITOR_UNICODE_HIGHLIGHT)).toEqual([false, false, false]);
  });

  it('o provedor de autocomplete lê o texto até o cursor', () => {
    const { monaco, calls } = fakeMonaco();
    registerGoiasScript(monaco);
    const provider = calls.registerCompletionItemProvider?.mock.calls[0]?.[1] as { provideCompletionItems: (model: unknown, position: unknown) => { suggestions: readonly { label: string }[] } };
    const model = { getLineContent: () => 'uai x é lista.pu' };
    const result = provider.provideCompletionItems(model, { lineNumber: 1, column: 17 });
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('o provedor de hover devolve null fora de palavra conhecida', () => {
    const { monaco, calls } = fakeMonaco();
    registerGoiasScript(monaco);
    const provider = calls.registerHoverProvider?.mock.calls[0]?.[1] as { provideHover: (model: unknown, position: unknown) => unknown };
    const model = { getWordAtPosition: () => ({ word: 'nadaAver', startColumn: 1, endColumn: 9 }) };
    expect(provider.provideHover(model, { lineNumber: 1, column: 2 })).toBeNull();
    const known = { getWordAtPosition: () => ({ word: 'uai', startColumn: 1, endColumn: 4 }) };
    expect(provider.provideHover(known, { lineNumber: 1, column: 2 })).toMatchObject({ range: { startColumn: 1, endColumn: 4 } });
    expect(provider.provideHover({ getWordAtPosition: () => null }, { lineNumber: 1, column: 1 })).toBeNull();
  });
});
