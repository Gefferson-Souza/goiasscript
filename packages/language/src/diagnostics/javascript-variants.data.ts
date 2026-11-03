import { tones as t } from './define-diagnostic.ts';
import type { DiagnosticVariant } from './diagnostics.types.ts';

// Chaves escolhidas pelo analisador no argumento `variant` do GS0402 e do GS0403.
export const NO_EQUIVALENT_VARIANTS: Readonly<Record<string, DiagnosticVariant>> = {
  noEquivalent: {
    messages: t('Ô sô, "{name}" é do JavaScript e não existe em GoiásScript.', '"{name}" é do JavaScript e não existe em GoiásScript.'),
  },
  nodeFeature: {
    messages: t('Ô sô, "{name}" é do JavaScript e não existe em GoiásScript.', '"{name}" é do JavaScript e não existe em GoiásScript.'),
    help: t('A v3 é um arquivo só e não mexe com o Node.', 'A v3 trabalha com um arquivo só e não mexe com o Node.'),
  },
};
