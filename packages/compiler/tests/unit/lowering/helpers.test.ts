import { runInNewContext } from 'node:vm';
import { STDLIB, lookupJsReserved } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { helperSourceOf } from '../../../src/helpers/helper-sources.ts';
import { emit } from '../../support/lower.ts';

describe('ajudantes', () => {
  it('programa só nativo não emite runtime', () => {
    const { code, helperRange, helpers } = emit('prosa(1)');
    expect(code).toBe('console.log(1);');
    expect(helperRange).toBeNull();
    expect(helpers).toEqual([]);
  });
  it('ajudante entra depois da última linha, é function e só é emitido se usado', () => {
    const { code, helperRange } = emit('uai l é [3, 1]\nprosa(l.arruma())');
    const lines = code.split('\n');
    expect(lines[0]).toBe('const l = [3, 1];');
    expect(lines[1]).toBe('console.log(l.toSorted($gs_ordem));');
    expect(helperRange).toEqual({ startLine: 3, endLine: lines.length });
    expect(code).toMatch(/\nfunction \$gs_ordem\(/);
    expect(code).not.toMatch(/\$gs_pergunta/);
  });
  it('estado global dos ajudantes usa var, nunca let/const no topo', () => {
    const { code } = emit('uai n é pergunta("x")');
    expect(code).toMatch(/\nvar \$gs_/);
    const helperText = code.split('\n').slice(1).join('\n');
    expect(helperText).not.toMatch(/^(let|const)\s/mu);
  });
  it('$gs_ordem é ordem total: números, textos pt-BR, resto estável', () => {
    const { code } = emit('uai l é [1]\nl.arruma()');
    const helper = code.slice(code.indexOf('function $gs_ordem'));
    const order = runInNewContext(`${helper}; $gs_ordem`) as (a: unknown, b: unknown) => number;
    const sorted = [Number.NaN, 'b', 2, null, 'a', 1].toSorted(order);
    expect(sorted.slice(0, 2)).toEqual([1, 2]);
    expect(Number.isNaN(sorted[2])).toBe(true);
    expect(sorted.slice(3, 5)).toEqual(['a', 'b']);
    expect(sorted[5]).toBeNull();
  });
  it('.trocar é ajudante e troca texto literal, sem $ especial', () => {
    const { code, helpers } = emit('prosa("a.b".trocar(".", "$&"))');
    expect(code.split('\n')[0]).toBe('console.log($gs_trocar("a.b", ".", "$&"));');
    expect(helpers).toEqual(['trocar']);
    const helper = code.slice(code.indexOf('function $gs_trocar'));
    const replaceLiteral = runInNewContext(`${helper}; $gs_trocar`) as (text: string, search: string, replacement: string) => string;
    expect(replaceLiteral('a.b.c', '.', '$&')).toBe('a$&b$&c');
  });
  it('vira_texto devolve JSON para lista e coisa', () => {
    const { code } = emit('prosa(vira_texto([1]))');
    expect(code.split('\n')[0]).toBe('console.log($gs_vira_texto([1]));');
    const helper = code.slice(code.indexOf('function $gs_vira_texto'));
    const stringify = runInNewContext(`${helper}; $gs_vira_texto`) as (value: unknown) => string;
    expect([stringify([1]), stringify(5)]).toEqual(['[1]', '5']);
  });
  it('.mensagem vira chamada do ajudante com o receptor', () => {
    const { code, helpers } = emit('tenta_aí { vixe("x") } se_der_ruim (e) { prosa(e.mensagem) }');
    expect(code.split('\n')[0]).toBe('try { throw new Error("x"); } catch (e) { console.log($gs_mensagem(e)); }');
    expect(helpers).toEqual(['mensagem']);
  });
  it('$gs_mensagem aceita valor lançado que não é Error', () => {
    const helper = helperSourceOf('mensagem') ?? '';
    const messageOf = runInNewContext(`${helper}; $gs_mensagem`) as (value: unknown) => string;
    expect([messageOf(new Error('oi')), messageOf('texto'), messageOf(7), messageOf(null), messageOf(undefined)]).toEqual([
      'oi',
      'texto',
      '7',
      'null',
      'undefined',
    ]);
  });
  it('playground: pergunta vai por mensagem ao hospedeiro, sem node:readline', () => {
    const { code } = emit('vai_na_frente faz_trem f() { faz_favor pergunta("Nome?") }', 'playground');
    expect(code).toContain('postMessage');
    expect(code).not.toContain('node:readline');
    expect(code).not.toContain('process.');
  });
  it('playground: $gs_pergunta resolve com a resposta do hospedeiro', async () => {
    const helper = helperSourceOf('pergunta', 'playground') ?? '';
    const posted: unknown[] = [];
    const listeners: ((event: { data: unknown }) => void)[] = [];
    const host = {
      postMessage: (message: unknown) => posted.push(message),
      addEventListener: (_type: string, listener: (event: { data: unknown }) => void) => listeners.push(listener),
      removeEventListener: (_type: string, listener: unknown) => listeners.splice(listeners.indexOf(listener as never), 1),
    };
    const ask = runInNewContext(`${helper}; $gs_pergunta`, { globalThis: host }) as (prompt: string) => Promise<string>;
    const answer = ask('Nome?');
    expect(posted).toEqual([{ type: 'gs:pergunta', prompt: 'Nome?' }]);
    listeners[0]?.({ data: { type: 'gs:resposta', value: 'Zé' } });
    await expect(answer).resolves.toBe('Zé');
    expect(listeners).toHaveLength(0);
  });
  it('ajudante repetido é emitido uma vez só', () => {
    const { helpers } = emit('prosa(vira_número("1"))\nprosa(vira_número("2"))');
    expect(helpers).toEqual(['vira_numero']);
  });
  it('só cita globais que estão em jsReserved', () => {
    const { code } = emit(
      'uai n é pergunta("x")\nprosa(Conta.sorteia_um(1, 2))\nprosa(vira_número("1,5"))\nprosa(é_número(1))\nprosa(vira_texto(1))\nprosa("a".trocar("a", "b"))\ncochila(1)',
    );
    const cited = new Set(code.match(/\b(Math|Number|Intl|Promise|Error|process|String|Object|JSON)\b/gu));
    for (const name of cited) expect(lookupJsReserved(name), name).toBeDefined();
  });
  it('cada ajudante da tabela da biblioteca tem fonte, e nome desconhecido não tem', () => {
    const names = STDLIB.filter((entry) => entry.kind === 'helper').map((entry) => entry.helperName ?? '');
    for (const name of names) expect(helperSourceOf(name), name).toMatch(new RegExp(`function \\$gs_${name}\\(`, 'u'));
    expect(helperSourceOf('inexistente')).toBeUndefined();
  });
});
