import { describe, expect, it } from 'vitest';
import { createReplEngine } from '../src/repl/engine.ts';
import type { ReplEngine } from '../src/repl/repl.types.ts';
import { createMemoryIo } from './support/memory-io.ts';

const setup = () => {
  const io = createMemoryIo();
  return { io, engine: createReplEngine({ io, tone: 'raiz' }) };
};
const echoOf = async (engine: ReplEngine, source: string) => {
  const result = await engine.evaluate(source);
  return result.kind === 'done' ? result.echo : result.kind;
};

describe('motor do REPL', () => {
  it('persiste declarações entre entradas e mostra o eco', async () => {
    const { io, engine } = setup();
    await engine.evaluate('uai x é 5');
    await engine.evaluate('prosa(x)');
    expect(io.stdoutText()).toBe('5\n');
    expect(await echoOf(engine, '1 mais 2')).toBe('3');
    expect(await echoOf(engine, '[1, 2]')).toBe('[ 1, 2 ]');
    expect(await echoOf(engine, '"oi"')).toBe('oi');
    expect(await echoOf(engine, 'indefinido')).toBeUndefined();
    expect(await echoOf(engine, 'prosa(1)')).toBeUndefined();
  });
  it('redeclarar substitui; reatribuir uai da sessão é GS0302', async () => {
    const { engine } = setup();
    await engine.evaluate('uai x é 1');
    await engine.evaluate('uai x é 2');
    expect(await echoOf(engine, 'x')).toBe('2');
    const result = await engine.evaluate('x é 3');
    expect(result).toMatchObject({ kind: 'failed' });
    expect(result.kind === 'failed' && result.diagnostics.map((d) => d.code)).toContain('GS0302');
  });
  it('entrada incompleta pede continuação; entrada com erro não registra nada', async () => {
    const { engine } = setup();
    expect(await engine.evaluate('faz_trem f() {')).toEqual({ kind: 'incomplete' });
    expect(await engine.evaluate('uai z é nomi')).toMatchObject({ kind: 'failed' });
    expect(await engine.evaluate('z')).toMatchObject({ kind: 'failed' });
  });
  it('erro de execução vira GS0710 com a linha e a sessão é adotada', async () => {
    const { engine } = setup();
    await engine.evaluate('uai q é { campo: 1 }\nuai nulo é nada');
    const result = await engine.evaluate('uai a é 1\nnulo.campo');
    expect(result).toMatchObject({ kind: 'threw', diagnostic: { code: 'GS0710' } });
    expect(await echoOf(engine, 'a')).toBe('1');
  });
  it('inicialização que lança deixa o nome indefinido e permite redeclarar', async () => {
    const { engine } = setup();
    await engine.evaluate('uai q é { campo: 1 }\nuai nulo é nada');
    await engine.evaluate('uai b é nulo.campo');
    expect(await echoOf(engine, 'b')).toBeUndefined();
    await engine.evaluate('uai b é 7');
    expect(await echoOf(engine, 'b')).toBe('7');
  });
  it('espera_um_cadim no topo e função assíncrona', async () => {
    const { engine } = setup();
    await engine.evaluate('vai_na_frente faz_trem g() { faz_favor 4 }');
    expect(await echoOf(engine, 'espera_um_cadim g()')).toBe('4');
  });
  it('pergunta usa a próxima linha como resposta e não abre segundo leitor', async () => {
    const { io, engine } = setup();
    const pending = engine.evaluate('uai n é pergunta("Nome?")');
    expect(engine.hasPendingQuestion()).toBe(true);
    engine.answer('Ana');
    await pending;
    expect(io.stdoutText()).toContain('Nome? ');
    expect(await echoOf(engine, 'n')).toBe('Ana');
  });
  it('fim da entrada com pergunta pendente falha com GS0702', async () => {
    const { engine } = setup();
    const pending = engine.evaluate('prosa(pergunta("a"))');
    engine.endOfInput();
    expect(await pending).toMatchObject({ kind: 'threw', diagnostic: { code: 'GS0702' } });
  });
  it('Erro do contexto vale para é_tipo_de e laço infinito é interrompido', async () => {
    const { io, engine } = setup();
    await engine.evaluate('tenta_aí { vixe("x") } se_der_ruim (e) { prosa(e é_tipo_de Erro) }');
    expect(io.stdoutText()).toBe('true\n');
    const looping = createReplEngine({ io, tone: 'raiz', entryTimeoutMs: 50 });
    expect(await looping.evaluate('enquanto_tiver (certeza) {\n}')).toEqual({ kind: 'interrupted' });
  });
  it('reset esvazia a sessão', async () => {
    const { engine } = setup();
    await engine.evaluate('uai x é 1');
    engine.reset();
    expect(engine.session.bindings).toEqual([]);
    expect(await engine.evaluate('x')).toMatchObject({ kind: 'failed' });
  });
  it('cancelar a pergunta pendente devolve cancelled e libera o motor', async () => {
    const { engine } = setup();
    const pending = engine.evaluate('uai r é pergunta("a")');
    engine.cancelPendingQuestion();
    expect(await pending).toEqual({ kind: 'cancelled' });
    expect(engine.hasPendingQuestion()).toBe(false);
  });
  it('pergunta depois do fim da entrada também falha com GS0702', async () => {
    const { engine } = setup();
    engine.endOfInput();
    expect(await engine.evaluate('prosa(pergunta("a"))')).toMatchObject({ kind: 'threw', diagnostic: { code: 'GS0702' } });
  });
  it('console do contexto escreve em out e err do sink injetado', async () => {
    const { io, engine } = setup();
    await engine.evaluate('prosa("a", 2)');
    await engine.evaluate('reclama("b")');
    expect(io.stdoutText()).toBe('a 2\n');
    expect(io.stderrText()).toBe('b\n');
  });
  it('reset cancela temporizadores da sessão anterior', async () => {
    const { io, engine } = setup();
    await engine.evaluate('setTimeout(() => { prosa("tarde") }, 20)');
    engine.reset();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(io.stdoutText()).toBe('');
  });
});
