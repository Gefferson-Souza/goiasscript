import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('await de pergunta', () => {
  it.each([
    ['pergunta("Nome?").gritando()', '(await $gs_pergunta("Nome?")).toUpperCase();'],
    ['uai c é pergunta("Nome?")[0]', 'const c = (await $gs_pergunta("Nome?"))[0];'],
    ['uai n é pergunta("Nome?").o_tanto', 'const n = (await $gs_pergunta("Nome?")).length;'],
    ['uai nome é pergunta("Nome?")', 'const nome = await $gs_pergunta("Nome?");'],
    ['prosa(pergunta("x"))', 'console.log(await $gs_pergunta("x"));'],
    ['uai n é espera_um_cadim pergunta("x")', 'const n = await $gs_pergunta("x");'],
    ['uai n é vira_número(pergunta("Idade?")) mais 1', 'const n = $gs_vira_numero(await $gs_pergunta("Idade?")) + 1;'],
  ])('%s', (src, line) => {
    expect(emit(src).code.split('\n')[0]).toBe(line);
  });
  it('encadeamento quebrado em duas linhas preserva as linhas', () => {
    const lines = emit('pergunta("a")\n  .trocar("x", "y")\n  .gritando()').code.split('\n');
    expect(lines.slice(0, 3)).toEqual(['$gs_trocar((await $gs_pergunta("a")),', ' "x", "y")', '  .toUpperCase();']);
  });
  it('pergunta do usuário não recebe await nem ajudante', () => {
    const { code, helpers } = emit('faz_trem pergunta() { faz_favor 1 }\npergunta()');
    expect(code).not.toContain('await');
    expect(helpers).toEqual([]);
  });
  it('em async: await dentro de vai_na_frente faz_trem', () => {
    expect(emit('vai_na_frente faz_trem f() { uai n é pergunta("x") }').code).toContain(
      'async function f() { const n = await $gs_pergunta("x");',
    );
  });
});
