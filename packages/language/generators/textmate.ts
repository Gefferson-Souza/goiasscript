import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { KeywordCategory, KeywordEntry } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText, keywordSpellings, memberNames, stdlibSpellings, toJson, uniqueSorted } from './shared.ts';

const SCOPE_BY_CATEGORY: Readonly<Record<KeywordCategory, string>> = {
  declaration: 'storage.type', assignment: 'keyword.operator.assignment', function: 'storage.type.function',
  control: 'keyword.control', class: 'storage.type.class', error: 'keyword.control.trycatch',
  literal: 'constant.language', operator: 'keyword.operator.word',
};
const CATEGORIES = Object.keys(SCOPE_BY_CATEGORY).toSorted(compareText) as readonly KeywordCategory[];
const WORD_START = '(?<![\\p{L}\\p{N}_])';
const WORD_END = '(?![\\p{L}\\p{N}_])';
const IDENTIFIER = '[\\p{L}_][\\p{L}\\p{N}_]*';
const FUNCTION_JS = new Set(['function', 'async function']);
const CONSTANT_JS = 'const';
const ESCAPE_PATTERN = { name: 'constant.character.escape.goiasscript', match: '\\\\.' };

// A alternância mais longa primeiro evita que "se" case dentro de "se_não".
const byLengthThenName = (left: string, right: string): number => right.length - left.length || compareText(left, right);
const alternation = (names: readonly string[]): string => `${WORD_START}(${names.toSorted(byLengthThenName).join('|')})${WORD_END}`;

function quoted(name: string, quote: string) {
  return { name: `string.quoted.${name}.goiasscript`, begin: quote, end: quote, patterns: [ESCAPE_PATTERN] };
}

// Palavra de declaração seguida do nome: a palavra guarda o escopo dela e o nome ganha o dele.
function declaredName(entries: readonly KeywordEntry[], nameScope: string) {
  const [first] = entries;
  if (first === undefined) throw new Error(`Faltou palavra-chave pra declarar ${nameScope}`);
  return {
    match: `${alternation(keywordSpellings(entries))}\\s+(${IDENTIFIER})${WORD_END}`,
    captures: { '1': { name: `${SCOPE_BY_CATEGORY[first.category]}.goiasscript` }, '2': { name: `${nameScope}.goiasscript` } },
  };
}

export function renderTextmateFiles(): readonly GeneratedFile[] {
  const keywordPatterns = CATEGORIES.map((category) => ({
    name: `${SCOPE_BY_CATEGORY[category]}.goiasscript`,
    match: alternation(keywordSpellings(KEYWORDS.filter((entry) => entry.category === category))),
  }));
  const globals = STDLIB.filter((entry) => entry.receiver === 'global').flatMap(stdlibSpellings);
  const members = STDLIB.filter((entry) => entry.receiver !== 'global').flatMap(memberNames);
  const grammar = {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: 'GoiásScript',
    scopeName: 'source.goiasscript',
    patterns: [
      { name: 'comment.line.double-slash.goiasscript', match: '//.*$' },
      { name: 'comment.block.goiasscript', begin: '/\\*', end: '\\*/' },
      quoted('double', '"'),
      quoted('single', "'"),
      { name: 'constant.numeric.goiasscript', match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
      declaredName(KEYWORDS.filter((entry) => FUNCTION_JS.has(entry.js)), 'entity.name.function'),
      declaredName(KEYWORDS.filter((entry) => entry.js === CONSTANT_JS), 'variable.other.constant'),
      ...keywordPatterns,
      { name: 'support.function.member.goiasscript', match: `(?<=\\.)${alternation(uniqueSorted(members))}` },
      { name: 'support.function.goiasscript', match: alternation(uniqueSorted(globals)) },
      { name: 'entity.name.function.goiasscript', match: `${WORD_START}${IDENTIFIER}(?=\\s*\\()` },
    ],
  };
  return [{ path: 'packages/language/generated/goiasscript.tmLanguage.json', content: toJson(grammar) }];
}
