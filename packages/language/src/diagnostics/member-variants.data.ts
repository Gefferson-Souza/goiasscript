import { tones as t } from './define-diagnostic.ts';
import type { DiagnosticVariant } from './diagnostics.types.ts';

// Chaves escolhidas pela análise no argumento `variant` do GS0305.
export const MEMBER_VARIANTS: Readonly<Record<string, DiagnosticVariant>> = {
  external: {
    messages: t('Esse trem ".{name}" não existe por aqui.', 'O membro ".{name}" não foi declarado.'),
    help: t('Se a coisa veio de fora, como um JSON, lê com colchete: ["{name}"].', 'Se o objeto veio de fora, como um JSON, leia com colchete: ["{name}"].'),
  },
};
