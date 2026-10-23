import type { EngoianadorFailureReason } from './engoianador-client.types.ts';

export const FAILURE_MESSAGES: Readonly<Record<EngoianadorFailureReason, string>> = {
  disabled: 'O Engoianador tá de folga, sô. Volta mais tarde.',
  'rate-limited': 'Calma aí, sô! Ocê já engoianou demais por hoje. Volta amanhã.',
  invalid: 'Esse texto não serve pro Engoianador, sô. Vê se não tá vazio nem grande demais.',
  unavailable: 'Ô rapaz! O Engoianador não respondeu. Tenta de novo daqui a pouco.',
};
