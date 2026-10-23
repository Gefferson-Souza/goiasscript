import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMANDS } from '../packages/cli/src/args/commands.data.ts';
import { KEYWORDS, RETIRED_WORDS, STDLIB } from '../packages/language/src/index.ts';
import { checkDocCommands } from './docs-commands.ts';
import { collectMarkdown } from './docs-files.ts';
import { CLI_BINARIES, CLI_GLOBAL_FLAGS, WORD_ALLOWLIST_PATH, WORD_SOURCES } from './docs-gate.constants.ts';
import type { AllowlistEntry, CommandRegistry } from './docs-gate.types.ts';
import { formatProblem } from './docs-blocks.ts';

interface Io {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

const isDefined = (value: string | undefined): value is string => value !== undefined;
const nfc = (text: string): string => text.normalize('NFC');

function languageWords(): ReadonlySet<string> {
  const names = [
    ...KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling]),
    ...STDLIB.flatMap((entry) => [entry.name, entry.asciiName].flatMap((name) => (name === undefined ? [] : [name, ...name.split('.')]))),
    ...RETIRED_WORDS.map((entry) => entry.word),
  ];
  return new Set(names.filter(isDefined).map(nfc));
}

export function loadRegistry(root: string): CommandRegistry {
  const allowlist = JSON.parse(fs.readFileSync(path.join(root, WORD_ALLOWLIST_PATH), 'utf8')) as readonly AllowlistEntry[];
  return {
    commands: new Set(COMMANDS.flatMap((command) => [command.name, command.asciiName]).filter(isDefined).map(nfc)),
    flags: new Set(CLI_GLOBAL_FLAGS),
    binaries: new Set(CLI_BINARIES),
    languageWords: languageWords(),
    allowlist,
  };
}

export function runCheckDocCommands(root: string, io: Io): number {
  const files = collectMarkdown(root, WORD_SOURCES.concat(['docs']));
  const problems = checkDocCommands(files, loadRegistry(root), new Set(WORD_SOURCES));
  if (problems.length > 0) {
    for (const item of problems) io.err(`${formatProblem(item)}\n`);
    io.err(`Ô sô, a documentação cita ${String(problems.length)} trem(ns) que não existe(m). Arruma e tenta de novo.\n`);
    return 1;
  }
  io.out(`Tá pronto, sô! ${String(files.length)} documento(s) conferido(s).\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  process.exit(runCheckDocCommands(root, { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) }));
}
