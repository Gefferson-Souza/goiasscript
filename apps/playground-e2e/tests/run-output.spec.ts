import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const ASYNC_ORDER_PROGRAM = [
  'prosa("um")',
  'daqui_um_cadim(() => prosa("três"), 100)',
  'prosa("dois")',
].join('\n');

const AWAIT_PROGRAM = [
  'vai_na_frente faz_trem principal() {',
  '  prosa("começo")',
  '  espera_um_cadim cochila(150)',
  '  prosa("meio")',
  '  espera_um_cadim cochila(150)',
  '  prosa("fim")',
  '}',
  'principal()',
].join('\n');

const STREAMS_PROGRAM = ['prosa("normal")', 'reclama("problema")'].join('\n');

const CAUGHT_TYPE_ERROR_PROGRAM = [
  'uai pessoa é { nome: "Zé" }',
  'tenta_aí {',
  '  prosa(pessoa.nome())',
  '} se_der_ruim (erro) {',
  '  prosa(erro.mensagem)',
  '}',
].join('\n');

const ENGINE_PHRASES = /cannot read|undefined|is not|null/iu;

async function runProgram(playground: PlaygroundPage, source: string): Promise<void> {
  await playground.open();
  await playground.typeProgram(source);
  await playground.run();
  await expect(playground.status()).toHaveText(STATUS_LABELS.finished);
}

test.describe('saída do programa', () => {
  test('preserva a ordem entre saída síncrona e assíncrona', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await runProgram(playground, ASYNC_ORDER_PROGRAM);
    await expect(playground.streamLines('out')).toHaveText([/um$/u, /dois$/u, /três$/u]);
  });

  test('saída de função assíncrona aparece completa antes de terminar', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await runProgram(playground, AWAIT_PROGRAM);
    await expect(playground.streamLines('out')).toHaveText([/começo$/u, /meio$/u, /fim$/u]);
  });

  test('erro vai para o fluxo err, visualmente distinto da saída normal', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await runProgram(playground, STREAMS_PROGRAM);
    await expect(playground.streamLines('out')).toHaveText([/normal$/u]);
    await expect(playground.streamLines('err')).toHaveText([/problema$/u]);
  });

  test('erro de execução capturado mostra a mensagem em português, sem frase do motor', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await runProgram(playground, CAUGHT_TYPE_ERROR_PROGRAM);
    const output = await playground.output();
    expect(output).toContain('erro de tipo');
    expect(output).not.toMatch(ENGINE_PHRASES);
  });
});
