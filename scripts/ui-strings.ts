import fs from 'node:fs';
import path from 'node:path';
import { DIAGNOSTICS } from '../packages/language/src/index.ts';
import { BLANK, CLI_HELP_PATH, CLI_HELP_SOURCE } from './gate.constants.ts';
import type { UiString } from './gate.types.ts';
import { extractStringLiterals } from './ui-strings.literals.ts';
import { discoverUiSourceFiles } from './ui-strings.sources.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

export function collectCatalogStrings(): readonly UiString[] {
  return DIAGNOSTICS.flatMap((entry) => {
    const withCode = (source: string, text: string): UiString => ({ source, text, diagnosticCode: entry.code });
    const tones = (['raiz', 'neutro'] as const).flatMap((tone) => [
      withCode(`diagnostics:${tone}`, entry.messages[tone]),
      ...(entry.help === undefined ? [] : [withCode(`diagnostics:${tone}`, entry.help[tone])]),
    ]);
    return [withCode('diagnostics:raiz', entry.title), ...tones, withCode('diagnostics:example', entry.example)];
  });
}

function collectHelpStrings(): readonly UiString[] {
  const lines = fs.readFileSync(path.join(ROOT_DIR, CLI_HELP_PATH), 'utf8').split('\n');
  return lines.filter((line) => !BLANK.test(line)).map((text) => ({ source: CLI_HELP_SOURCE, text }));
}

export function collectUserFacingStrings(): readonly UiString[] {
  const declared = discoverUiSourceFiles(ROOT_DIR).flatMap((file) => extractStringLiterals(fs.readFileSync(path.join(ROOT_DIR, file), 'utf8')).map((text) => ({ source: file, text })));
  return [...collectCatalogStrings(), ...collectHelpStrings(), ...declared];
}
