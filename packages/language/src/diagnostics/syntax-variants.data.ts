import { tones as t } from './define-diagnostic.ts';
import type { DiagnosticVariant } from './diagnostics.types.ts';

// Chaves escolhidas pelo parser no argumento `variant` do GS0202.
export const SYNTAX_VARIANTS: Readonly<Record<string, DiagnosticVariant>> = {
  missingOperand: {
    messages: t('Ô sô, faltou um valor depois de "{operator}".', 'Falta um valor depois de "{operator}".'),
    help: t('Escreve o valor que falta, tipo: 1 mais 2.', 'Escreva o valor que falta, por exemplo: 1 mais 2.'),
  },
  bareThrow: {
    messages: t('Ô sô, o "vixe" leva parênteses: vixe(faz_um Erro("deu ruim")).', 'O "vixe" leva parênteses: vixe(faz_um Erro("deu ruim")).'),
  },
  numberMethod: {
    messages: t('Ô sô, número solto não aceita "{found}" colado nele.', 'Número literal não aceita "{found}" colado nele.'),
    help: t('Põe o número entre parênteses: (5).com_casas(2).', 'Coloque o número entre parênteses: (5).com_casas(2).'),
  },
  arrowTail: {
    messages: t('Ô sô, a seta com chaves termina no "}", e "{found}" não cabe colado nela.', 'A seta com bloco termina no "}"; "{found}" não pode vir colado nela.'),
    help: t('Põe a seta entre parênteses ou guarda ela num nome antes: uai dobro é x => { faz_favor x vezes 2 }.', 'Coloque a seta entre parênteses ou guarde-a num nome antes: uai dobro é x => { faz_favor x vezes 2 }.'),
  },
  strayDot: {
    messages: t('Ô sô, esse ponto solto não vale. Em número, escreve 5 ou 5.0; no fim da linha, tira o ponto.', 'Ponto solto depois do número. Escreva 5 ou 5.0; no fim da linha, remova o ponto.'),
  },
};
