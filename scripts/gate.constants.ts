export const FORBIDDEN_ENGLISH_PATH = 'tools/promises/forbidden-english.json';
export const ENGLISH_ALLOWLIST_PATH = 'tools/promises/english-allowlist.json';
export const TRACEABILITY_PATH = 'tools/promises/traceability.json';
export const README_CLAIMS_PATH = 'tools/promises/readme-claims.json';
export const CLI_HELP_PATH = 'packages/language/generated/cli-help.txt';
export const CLI_HELP_SOURCE = 'cli-help.txt';
export const COMPILER_ALLOWED_DEPENDENCY = '@goiasscript/language';
export const WORKSPACE_PROTOCOL = 'workspace:';
export const COMPILER_PACKAGE_DIR = 'packages/compiler';
export const LANGUAGE_PACKAGE_DIR = 'packages/language';
export const SOURCE_FILE = /\.ts$/u;
export const IMPORT_SPECIFIER = /(?:^|\s)(?:import|export)\b[^'";]*?\bfrom\s+['"]([^'"]+)['"]|(?:^|\s)import\s+['"]([^'"]+)['"]/gmu;
export const QUOTED_IDENTIFIER = /"[\p{L}_$][\p{L}\p{N}_$]*(?:\.[\p{L}_$][\p{L}\p{N}_$]*)*(?:\(\))?"/gu;
export const WORD_CHAR = '[\\p{L}\\p{N}_]';
export const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/gu;
export const TEST_TITLE = /\b(?:it|test|describe)(?:\.\w+)*\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/gu;
export const CI_ONLY_TEST_PATH = /^apps\/playground-e2e\/|\/tests\/e2e\/|\/tests\/integration\//u;
export const UI_SOURCE_ROOTS: readonly string[] = ['apps/playground/app/', 'apps/playground/components/', 'apps/playground/lib/', 'apps/engoianador-api/src/', 'packages/cli/src/'];
export const UI_SOURCE_FILE = /\.(?:constants|data)\.ts$/u;
export const UI_SOURCE_EXCLUSIONS: Readonly<Record<string, string>> = {
  'apps/engoianador-api/src/cache.constants.ts': 'chaves e mensagens de log do Worker, nunca exibidas ao usuário',
  'apps/engoianador-api/src/quota/quota-ledger.constants.ts': 'SQL e mensagens de log do Worker, nunca exibidas ao usuário',
};
export const BLANK = /^\s*$/u;
