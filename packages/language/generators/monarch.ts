import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { keywordSpellings, memberName, toJson, uniqueSorted } from './shared.ts';

const IDENTIFIER = String.raw`[\p{L}_][\p{L}\p{N}_]*`;
const NUMBER = String.raw`\d+(\.\d+)?([eE][+-]?\d+)?`;

const stringState = (quote: string) => [
  [String.raw`[^\\${quote}]+`, 'string'],
  [String.raw`\\.`, 'string.escape'],
  [quote, { token: 'string', next: '@pop' }],
];

export function renderMonarchFiles(): readonly GeneratedFile[] {
  const language = {
    defaultToken: '',
    tokenPostfix: '.gs',
    unicode: true,
    keywords: uniqueSorted(keywordSpellings(KEYWORDS)),
    library: uniqueSorted(STDLIB.map(memberName)),
    tokenizer: {
      root: [
        [IDENTIFIER, { cases: { '@keywords': 'keyword', '@library': 'type.identifier', '@default': 'identifier' } }],
        [NUMBER, 'number'],
        ['"', { token: 'string', next: '@dq' }],
        ["'", { token: 'string', next: '@sq' }],
        [String.raw`//.*$`, 'comment'],
        [String.raw`/\*`, { token: 'comment', next: '@comment' }],
      ],
      dq: stringState('"'),
      sq: stringState("'"),
      comment: [
        [String.raw`[^/*]+`, 'comment'],
        [String.raw`\*/`, { token: 'comment', next: '@pop' }],
        [String.raw`[/*]`, 'comment'],
      ],
    },
  };
  return [{ path: 'packages/language/generated/goiasscript.monarch.json', content: toJson(language) }];
}
