export const FENCE_OPENING = /^ {0,3}(`{3,})(.*)$/u;
export const BLOCK_LANGUAGE = 'goiasscript';
export const INPUT_FLAG_PREFIX = 'entrada=';
export const SKIP_RUN_FLAG = 'sem-execucao';
export const EXPECTED_ERROR_FLAG = 'erro-esperado';
export const EXAMPLE_FLAG = 'exemplo';
export const DIAGNOSTIC_CODE = /^GS\d{4}$/u;
export const ESCAPED_NEWLINE = /\\n/gu;
export const LINE_BREAK = /\r?\n/u;

export const IGNORED_DOC_DIRS: readonly string[] = ['docs/superpowers', 'docs/auditoria', 'docs/pesquisa'];
export const IGNORED_DOC_PREFIX = 'docs/fase-';
export const BLOCK_SOURCES: readonly string[] = ['README.md', 'CLAUDE.md', 'docs', 'apps/playground/content/cartilha'];

export const WORD_SOURCES: readonly string[] = ['README.md', 'CLAUDE.md', '.github/copilot-instructions.md', 'CONTRIBUTING.md', 'docs/operacao.md'];
export const WORD_ALLOWLIST_PATH = 'tools/promises/word-allowlist.json';

export const CLI_PROGRAM = 'goiasscript';
export const CLI_BINARIES: readonly string[] = ['goiasscript', 'goias'];
export const CLI_GLOBAL_FLAGS: readonly string[] = ['--help', '-h', '--version', '-v', '-V'];

export const INLINE_CODE = /`([^`\n]+)`/gu;
export const SINGLE_WORD = /^[\p{L}_][\p{L}\p{N}_]*$/u;
export const COMMAND_MENTION = /(?:^|[\s$])goiasscript\s+(\S+)/gu;
export const TRAILING_PUNCTUATION = /[.,;:)"'`]+$/u;
export const LEADING_QUOTE = /^["'(]+/u;

export const RUN_TIMEOUT_MS = 10_000;
export const RUN_MAX_BUFFER_BYTES = 1_048_576;
export const RUN_DIR_PREFIX = 'gs-doc-';
export const RUN_FILE_NAME = 'programa.mjs';
export const RUN_ALLOW_FS_READ_FLAG = '--allow-fs-read=';
export const RUN_ENV_KEYS: readonly string[] = ['SystemRoot'];
