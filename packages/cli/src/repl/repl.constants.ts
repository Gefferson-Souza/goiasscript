import type { ReplSession } from '@goiasscript/compiler';

export const REPL_FILE_NAME = '<roda_de_prosa>';
export const ASK_GLOBAL_NAME = 'pergunta';
export const QUESTION_SEPARATOR = ' ';
export const END_OF_INPUT_CODE = 'GS0702';
export const EMPTY_SESSION: ReplSession = { bindings: [], members: [] };

export const INTERRUPTION_CODES: ReadonlySet<string> = new Set(['ERR_SCRIPT_EXECUTION_INTERRUPTED', 'ERR_SCRIPT_EXECUTION_TIMEOUT']);

// Entrada com await no topo sai embrulhada nesta função assíncrona (alvo repl do compilador).
export const ASYNC_WRAPPER_PATTERN = /^'use strict'; (?:let [^;]*; )?\(async \(\) => \{ /u;

export const CANCELLED = Symbol('cancelled');
