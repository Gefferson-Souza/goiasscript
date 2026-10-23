export const EDITOR_THEME_NAME = 'goias-dark';

export const EDITOR_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'f5c518', fontStyle: 'bold' },
    { token: 'keyword.storage', foreground: '79c0ff', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'ff7b72' },
    { token: 'constant', foreground: 'ffa657' },
    { token: 'type', foreground: '7ee787' },
    { token: 'support.function', foreground: 'd2a8ff' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'number', foreground: 'f0883e' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e6edf3',
    'editorLineNumber.foreground': '#484f58',
    'editorLineNumber.activeForeground': '#f5c518',
    'editor.selectionBackground': '#f5c51844',
  },
} as const;

export const EDITOR_LANGUAGE_CONFIGURATION = {
  comments: { lineComment: '//', blockComment: ['/*', '*/'] },
  brackets: [['{', '}'], ['[', ']'], ['(', ')']],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
} as const;
