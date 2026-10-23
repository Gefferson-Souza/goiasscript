const CLI_USAGE_EXIT_CODE = 3;

export const CLI_ENTRY_RELATIVE_PATH = 'dist/cli/goiasscript.mjs';
export const TONE_FLAG = '--tom';
export const OVERWRITE_FLAG = '--sobrescreve';
export const END_OF_OPTIONS = '--';
export const ELECTRON_RUN_AS_NODE = 'ELECTRON_RUN_AS_NODE';
export const FORWARDED_ENV_KEYS = ['PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TEMP', 'LANG', 'SystemRoot'] as const;
export const MAX_OUTPUT_BYTES = 16_777_216;
export const OVERWRITE_REFUSED_CODE = 'GS0903';
export const OVERWRITE_EXIT_CODE = CLI_USAGE_EXIT_CODE;
export const FAILURE_EXIT_CODE = 1;
export const CTRL_C = '\u0003';
export const BACKSPACE = '\u007f';
export const ERASE_ONE_CHARACTER = '\b \b';
export const ENTER_KEYS: ReadonlySet<string> = new Set(['\r', '\n']);
export const STDIN_LINE_END = '\n';
export const OVERWRITE_LABEL = 'Sobrescreve';
