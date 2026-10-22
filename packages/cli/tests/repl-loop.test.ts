import { describe, expect, it } from 'vitest';
import { createPseudoTerminal } from './support/pseudo-terminal.ts';

const startRepl = () => createPseudoTerminal();

describe('roda de prosa', () => {
  it('multilinha por incomplete, com continuação e resultado', async () => {
    const term = startRepl();
    term.type('faz_trem soma(a, b) {\n');
    await term.settled();
    expect(term.screen()).toContain('... ');
    term.type('  faz_favor a mais b\n}\n');
    term.type('soma(1, 2)\n');
    await term.settled();
    expect(term.screen()).toMatch(/^3$/mu);
  });
  it('erro no meio do bloco mostra o diagnóstico e descarta o buffer', async () => {
    const term = startRepl();
    term.type('faz_trem f() {\n  prosa(nomi)\n}\n');
    await term.settled();
    expect(term.screen()).toContain('GS0301');
    term.type('1 mais 1\n');
    await term.settled();
    expect(term.screen()).toMatch(/^2$/mu);
  });
  it('linha que começa com ponto é continuação dentro do buffer e comando fora dele', async () => {
    const term = startRepl();
    term.type('uai l é [1, 2]\nuai d é (l\n  .mapear((n) => n vezes 2)\n)\nd\n');
    await term.settled();
    expect(term.screen()).toContain('[ 2, 4 ]');
    term.type('.5 mais 1\n.mostra_os_trem\n');
    await term.settled();
    expect(term.screen()).toContain('1.5');
    expect(term.screen()).toMatch(/l\s+uai/u);
  });
  it('Ctrl+C descarta a entrada pendente e só sai no segundo, Ctrl+D sai', async () => {
    const term = startRepl();
    term.type('faz_trem f() {\n');
    await term.settled();
    term.press('ctrl-c');
    term.type('1 mais 1\n');
    await term.settled();
    expect(term.screen()).toMatch(/^2$/mu);
    term.press('ctrl-c');
    await term.settled();
    expect(term.closedYet()).toBe(false);
    term.press('ctrl-c');
    expect(await term.exitCode).toBe(0);
  });
  it('Ctrl+D encerra com 0', async () => {
    const term = startRepl();
    term.press('ctrl-d');
    expect(await term.exitCode).toBe(0);
  });
  it('pergunta consome a próxima linha e a entrada seguinte espera', async () => {
    const term = startRepl();
    term.type('uai n é pergunta("Nome?")\nAna\nn\n');
    await term.settled();
    expect(term.screen()).toContain('Nome? ');
    expect(term.screen()).toMatch(/^Ana$/mu);
  });
  it('TAB completa no terminal', async () => {
    const term = startRepl();
    term.type('se_oc');
    term.press('tab');
    await term.settled();
    expect(term.screen()).toContain('se_ocê_quiser');
  });
  it('.zera_o_trem limpa a sessão e .vaza sai com 0', async () => {
    const term = startRepl();
    term.type('uai x é 1\n.zera_o_trem\nx\n');
    await term.settled();
    expect(term.screen()).toContain('GS0301');
    term.type('.vaza\n');
    expect(await term.exitCode).toBe(0);
  });
  it('comando desconhecido sugere o parecido e .lembra_aí lista as entradas aceitas', async () => {
    const term = startRepl();
    term.type('uai x é 1\n.vazaa\n.lembra_aí\n');
    await term.settled();
    expect(term.screen()).toContain('.vaza');
    expect(term.screen()).toContain('uai x é 1');
  });
  it('laço infinito é interrompido sem fechar a sessão', async () => {
    const term = createPseudoTerminal('raiz', { entryTimeoutMs: 50 });
    term.type('enquanto_tiver (certeza) {\n}\n1 mais 1\n');
    await term.settled();
    expect(term.screen()).toContain('interromp');
    expect(term.screen()).toMatch(/^2$/mu);
  });
});
