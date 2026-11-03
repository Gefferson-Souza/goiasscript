import { tones as t } from './define-diagnostic.ts';
import type { DiagnosticVariant } from './diagnostics.types.ts';

// Chaves escolhidas pelo tradutor de erros de execução no argumento `variant`.
export const RANGE_VARIANTS: Readonly<Record<string, DiagnosticVariant>> = {
  stackOverflow: {
    messages: t('Ô sô, essa função se chama sem parar.', 'Essa função se chama sem parar e estourou o limite de chamadas.'),
    help: t('Falta um jeito de parar: um se_ocê_quiser com faz_favor antes da chamada.', 'Falta uma condição de parada: um se_ocê_quiser com faz_favor antes da chamada.'),
  },
};

export const SYNTAX_RUNTIME_VARIANTS: Readonly<Record<string, DiagnosticVariant>> = {
  invalidJson: {
    messages: t('Ô sô, esse texto não é uma coisa válida pro Coisa.vira_coisa.', 'Esse texto não é uma coisa válida para Coisa.vira_coisa.'),
    help: t('Confere as aspas e as chaves do texto.', 'Confira as aspas e as chaves do texto.'),
  },
};
