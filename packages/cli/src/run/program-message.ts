import type { Tone } from '@goiasscript/compiler';
import { sanitizeForTerminal } from '../diagnostics/sanitize-terminal.ts';
import { chooseByTone } from '../tone-choice.ts';
import { OBJECT_AS_MESSAGE, OBJECT_MESSAGE_NOTE, PROGRAM_MESSAGE_LABEL, PROGRAM_MESSAGE_MAX_LENGTH } from './runtime-report.constants.ts';

// Só `Error` puro sem `code` nasce de `vixe`/`faz_um Erro(msg)`; erros do motor e do Node têm outro nome ou `code`.
export function programMessageOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { name, message } = error as { readonly name?: unknown; readonly message?: unknown };
  if (name !== 'Error' || typeof message !== 'string' || message === '' || 'code' in error || 'gsCode' in error) return undefined;
  return message.slice(0, PROGRAM_MESSAGE_MAX_LENGTH);
}

// O `new Error(coisa)` vira "[object Object]"; o conteúdo se perdeu, então a linha ensina a forma certa.
export function programLineOf(message: string, tone: Tone): string {
  if (message === OBJECT_AS_MESSAGE) return `  ${chooseByTone(tone, OBJECT_MESSAGE_NOTE.root, OBJECT_MESSAGE_NOTE.neutral)}`;
  return `  ${chooseByTone(tone, PROGRAM_MESSAGE_LABEL.root, PROGRAM_MESSAGE_LABEL.neutral)}: ${sanitizeForTerminal(message)}`;
}
