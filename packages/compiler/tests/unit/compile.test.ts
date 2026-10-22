import { parse as acornParse } from 'acorn';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';

describe('compile', () => {
  it('sucesso: code, map, helperRange nulo e diagnósticos vazios', () => {
    const result = compile('prosa("oi")');
    expect(result).toMatchObject({ ok: true, code: 'console.log("oi");', helperRange: null, session: null, echo: false });
    expect(result.ok && result.map?.version).toBe(3);
  });
  it('sourceMap: false devolve map nulo', () => {
    const result = compile('prosa(1)', { sourceMap: false });
    expect(result.ok && result.map).toBeNull();
  });
  it('vários diagnósticos ordenados por posição', () => {
    const result = compile('uai a = 1\nconsole.log(a)\nuai b é nomi');
    expect(result.ok).toBe(false);
    const codes = result.diagnostics.map((d) => d.code);
    expect(codes.length).toBeGreaterThanOrEqual(3);
    const starts = result.diagnostics.map((d) => d.range.start.offset);
    expect(starts).toEqual([...starts].sort((x, y) => x - y));
  });
  it('tom neutro muda a frase', () => {
    const rootTone = compile('uai x é nomi', { tone: 'raiz' }).diagnostics[0]?.message;
    const neutralTone = compile('uai x é nomi', { tone: 'neutro' }).diagnostics[0]?.message;
    expect(rootTone).not.toBe(neutralTone);
  });
  it('warning não derruba ok', () => {
    const result = compile('uai Data é 1\nprosa(Data)');
    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toEqual(['GS0804']);
  });
  it.each([
    ['uai vezes é 3; prosa(vezes)', ['GS0303']],
    ['faz_trem f(mais) { faz_favor mais }', ['GS0303']],
    ['prosa(vezes)', ['GS0202']],
  ])('nome reservado declarado e usado de novo: %j dá %j', (source, expected) => {
    expect(compile(source).diagnostics.map((d) => d.code)).toEqual(expected);
  });
  it('ok: true implica JS aceito pelo acorn', () => {
    const result = compile('uai l é [3, 1]\nprosa(l.arruma())\nuai n é pergunta("x")');
    if (!result.ok) throw new Error('esperava ok');
    expect(() => acornParse(result.code, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
  });
});

describe('compile: REPL e determinismo', () => {
  it('repl: incomplete só para GS0201/GS0106', () => {
    expect(compile('faz_trem f() {', { target: 'repl' })).toMatchObject({ ok: false, incomplete: true });
    expect(compile('/* aberto', { target: 'repl' })).toMatchObject({ ok: false, incomplete: true });
    expect(compile('uai t é "aberto', { target: 'repl' })).toMatchObject({ ok: false, incomplete: false });
    expect(compile('faz_trem f() {', { target: 'module' })).toMatchObject({ ok: false, incomplete: false });
  });
  it('repl: session soma, não muta e echo marca expressão', () => {
    const session = { bindings: [{ name: 'x', kind: 'uai' as const }], members: [] };
    const frozen = JSON.stringify(session);
    const result = compile('uai y é 1\ny mais x', { target: 'repl', session });
    expect(JSON.stringify(session)).toBe(frozen);
    expect(result).toMatchObject({ ok: true, echo: true });
    expect(result.ok && result.session?.bindings.map((b) => b.name)).toEqual(['x', 'y']);
  });
  it('repl: entrada que não compila não devolve sessão', () => {
    const result = compile('uai z é nomi', { target: 'repl' });
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('session');
  });
  it('compile é determinístico', () => {
    const src = 'uai l é [2, 1]\nprosa(l.arruma())';
    expect(compile(src)).toEqual(compile(src));
  });
});
