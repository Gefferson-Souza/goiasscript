import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const TWO_QUESTIONS_PROGRAM = [
  'uai nome é espera_um_cadim pergunta("Qual teu nome?")',
  'uai cidade é espera_um_cadim pergunta("De onde ocê é?")',
  'prosa(nome mais " de " mais cidade)',
].join('\n');

const ECHO_PROGRAM = ['uai texto é espera_um_cadim pergunta("Fala aí")', 'prosa("eco: " mais texto)'].join('\n');

test.describe('caixa de pergunta', () => {
  test('responde duas perguntas em sequência', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram(TWO_QUESTIONS_PROGRAM);
    await playground.run();

    await expect(playground.askBox()).toContainText('Qual teu nome?');
    await playground.answer('Zé');
    await expect(playground.askBox()).toContainText('De onde ocê é?');
    await playground.answer('Goiânia');

    await expect(playground.status()).toHaveText(STATUS_LABELS.finished);
    await expect(playground.streamLines('out')).toHaveText([/Zé de Goiânia$/u]);
    await expect(playground.askBox()).toHaveCount(0);
  });

  test('Parar durante a pergunta encerra a execução', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram(ECHO_PROGRAM);
    await playground.run();

    await expect(playground.askBox()).toBeVisible();
    await playground.stop();
    await expect(playground.status()).toHaveText(STATUS_LABELS.stopped);
    await expect(playground.askBox()).toHaveCount(0);
  });

  test('resposta com HTML aparece como texto, sem virar elemento', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram(ECHO_PROGRAM);
    await playground.run();

    await expect(playground.askBox()).toBeVisible();
    await playground.answer('<b>x</b>');
    await expect(playground.status()).toHaveText(STATUS_LABELS.finished);
    expect(await playground.output()).toContain('eco: <b>x</b>');
    await expect(playground.outputElements('b')).toHaveCount(0);
  });
});
