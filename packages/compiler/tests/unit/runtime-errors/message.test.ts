import { runInNewContext } from 'node:vm';
import { STDLIB } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';
import { helperSourceOf } from '../../../src/helpers/helper-sources.ts';

const readMessage = runInNewContext(`${helperSourceOf('mensagem') ?? ''}; $gs_mensagem`) as (e: unknown) => string;
const evaluate = (code: string): unknown => runInNewContext(code) as unknown;

function thrownBy(run: () => unknown): unknown {
  try {
    run();
  } catch (error: unknown) {
    return error;
  }
  return undefined;
}

const TYPE_PHRASE = 'Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.';
const REFERENCE_PHRASE = 'Ô sô, o programa usou um nome que ainda não existe.';
const RANGE_PHRASE = 'Ô sô, um número ficou fora do que o trem aceita.';
const SYNTAX_PHRASE = 'Ô sô, o motor não entendeu um trecho do código.';
const END_OF_INPUT_PHRASE = 'Acabou a entrada, sô: o programa pediu uma resposta e não veio mais nada.';

describe('$gs_mensagem', () => {
  it.each([
    ['null.x', TYPE_PHRASE, () => (null as unknown as { x: number }).x],
    ['chamar valor', TYPE_PHRASE, () => { (5 as unknown as () => void)(); }],
    ['sem declaração', REFERENCE_PHRASE, () => evaluate('naoExiste')],
    ['TDZ', REFERENCE_PHRASE, () => evaluate('x; let x = 1;')],
    ['repete negativo', RANGE_PHRASE, () => 'a'.repeat(-1)],
    ['casas', RANGE_PHRASE, () => (1).toFixed(101)],
    ['recursão', RANGE_PHRASE, () => { const f = (): unknown => f(); f(); }],
    ['sintaxe', SYNTAX_PHRASE, () => evaluate('uai x')],
  ])('%s devolve a frase genérica da classe, em português', (_name, phrase, run) => {
    expect(readMessage(thrownBy(run))).toBe(phrase);
  });
  it('erro do programa devolve a mensagem intacta', () => {
    expect(readMessage(new Error('Deu ruim, sô!'))).toBe('Deu ruim, sô!');
  });
  it('erro de outro realm é classificado por name', () => {
    expect(readMessage(runInNewContext('new TypeError("x")'))).toBe(TYPE_PHRASE);
  });
  it('erro marcado pelo compilador devolve a frase do catálogo, nunca o marcador', () => {
    expect(readMessage(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }))).toBe(END_OF_INPUT_PHRASE);
  });
  it('e.mensagem compila para o ajudante e devolve a mensagem do programa', () => {
    const result = compile('uai e é faz_um Erro("Deu ruim, sô!")\nprosa(e.mensagem)');
    if (!result.ok) throw new Error('compilação falhou');
    const printed: unknown[] = [];
    runInNewContext(result.code, { console: { log: (value: unknown) => printed.push(value) } });
    expect(printed).toEqual(['Deu ruim, sô!']);
  });
  it('toda entrada helper da biblioteca tem fonte de ajudante', () => {
    const names = STDLIB.filter((entry) => entry.kind === 'helper').map((entry) => entry.helperName ?? '');
    expect(names.filter((name) => helperSourceOf(name) === undefined)).toEqual([]);
  });
});
