import { CLI_PROGRAM, COMMAND_MENTION, INLINE_CODE, LEADING_QUOTE, SINGLE_WORD, TRAILING_PUNCTUATION, WORD_ALLOWLIST_PATH } from './docs-gate.constants.ts';
import type { CommandRegistry, DocFile, DocMentions, DocProblem, LocatedMention, LocatedMentions } from './docs-gate.types.ts';
import { scanMarkdown } from './docs-markdown.ts';

const nfc = (text: string): string => text.normalize('NFC');
const FENCE_LANGUAGE_GOIASSCRIPT = 'goiasscript';

function commandsIn(text: string, line: number): readonly LocatedMention[] {
  return [...text.matchAll(COMMAND_MENTION)]
    .map((match) => ({ name: nfc((match[1] ?? '').replace(LEADING_QUOTE, '').replace(TRAILING_PUNCTUATION, '')), line }))
    .filter((mention) => mention.name !== '');
}

function locateMentions(markdown: string): LocatedMentions {
  const scanned = scanMarkdown(markdown);
  const spans = scanned.prose.flatMap(({ line, text }) => [...text.matchAll(INLINE_CODE)].map((match) => ({ name: nfc(match[1] ?? ''), line })));
  const shell = scanned.fenced
    .filter((block) => block.tokens[0] !== FENCE_LANGUAGE_GOIASSCRIPT)
    .flatMap((block) => block.code.split('\n').map((text, index) => ({ text, line: block.line + 1 + index })));
  return {
    commands: [...spans.flatMap(({ name, line }) => commandsIn(name, line)), ...shell.flatMap(({ text, line }) => commandsIn(text, line))],
    words: spans.filter(({ name }) => SINGLE_WORD.test(name)),
  };
}

export function extractCommandMentions(markdown: string): DocMentions {
  const located = locateMentions(markdown);
  return { commands: located.commands.map(({ name }) => name), words: located.words.map(({ name }) => name) };
}

const isPlaceholder = (name: string): boolean => name.startsWith('<') || name.startsWith('[');

function commandProblems(file: string, mentions: readonly LocatedMention[], registry: CommandRegistry): readonly DocProblem[] {
  return mentions
    .filter(({ name }) => !isPlaceholder(name) && !registry.commands.has(name) && !registry.flags.has(name))
    .map(({ name, line }) => ({ file, line, message: `o comando "${CLI_PROGRAM} ${name}" não existe no CLI.` }));
}

function wordKnown(word: string, registry: CommandRegistry): boolean {
  return registry.languageWords.has(word) || registry.commands.has(word) || registry.binaries.has(word) || registry.allowlist.some((entry) => nfc(entry.word) === word);
}

function wordProblems(file: string, mentions: readonly LocatedMention[], registry: CommandRegistry): readonly DocProblem[] {
  return mentions
    .filter(({ name }) => !wordKnown(name, registry))
    .map(({ name, line }) => ({ file, line, message: `a palavra "${name}" citada em código não está na tabela da linguagem nem na lista de permissão.` }));
}

function allowlistProblems(registry: CommandRegistry): readonly DocProblem[] {
  return registry.allowlist
    .filter((entry) => entry.reason.trim() === '')
    .map((entry) => ({ file: WORD_ALLOWLIST_PATH, line: 1, message: `a palavra "${entry.word}" está na lista de permissão sem razão.` }));
}

function fileProblems(doc: DocFile, registry: CommandRegistry, wordFiles: ReadonlySet<string>): readonly DocProblem[] {
  const located = locateMentions(doc.text);
  const fromWords = wordFiles.has(doc.file) ? wordProblems(doc.file, located.words, registry) : [];
  return [...commandProblems(doc.file, located.commands, registry), ...fromWords];
}

export function checkDocCommands(files: readonly DocFile[], registry: CommandRegistry, wordFiles: ReadonlySet<string>): readonly DocProblem[] {
  return [...allowlistProblems(registry), ...files.flatMap((doc) => fileProblems(doc, registry, wordFiles))];
}
