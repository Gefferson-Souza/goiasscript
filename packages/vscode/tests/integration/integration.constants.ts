import type { IntegrationScenario } from './integration.types.ts';

export const HOSTILE_NAMES: readonly string[] = ['a$(touch PWNED).gs', 'a`touch PWNED`.gs', 'a";touch PWNED;".gs', 'a;b.gs', 'a b.gs'];
export const NTFS_FORBIDDEN_CHARACTERS: readonly string[] = ['"', '<', '>', ':', '*', '?', '|'];
export const PWNED_MARKER = 'PWNED';

export const SCENARIO_ENV = 'GOIASSCRIPT_IT_SCENARIO';
export const EXTENSION_ID = 'goiasscript.goiasscript-vscode';
export const LANGUAGE_ID = 'goiasscript';
// Texto literal de propósito: se a extensão mudar a origem do diagnóstico, o teste acusa.
export const DIAGNOSTICS_SOURCE = 'GoiásScript';
export const TRANSLATE_COMMAND = 'goiasscript.translate';
export const RUN_COMMAND = 'goiasscript.run';
export const SAMPLE_PROGRAM = 'prosa("oi")\n';
export const BROKEN_PROGRAM = 'uai x é\n';
export const BROKEN_PROGRAM_CODE = 'GS0201';
export const NOT_FILE_MESSAGE = 'arquivo salvo no disco';
export const UNTRUSTED_MESSAGE = 'a pasta precisa de confiança';
export const VIRTUAL_SCHEME = 'gs-test';
export const TEMP_DIR_PREFIX = 'gs-it-';
export const END_OF_OPTIONS = '--';

export const WAIT_TIMEOUT_MS = 20_000;
export const WAIT_INTERVAL_MS = 100;
export const TEST_TIMEOUT_MS = 60_000;

export const SCENARIO_FILES: Readonly<Record<IntegrationScenario, readonly string[]>> = {
  trusted: ['hostile-names.test.cjs', 'scheme-guard.test.cjs', 'untrusted-workspace.test.cjs', 'diagnostics.test.cjs'],
  untrusted: ['untrusted-workspace.test.cjs'],
};
export const CLI_ENTRY_FILE_NAME = 'goiasscript.mjs';
