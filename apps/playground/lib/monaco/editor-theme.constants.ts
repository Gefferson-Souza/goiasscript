import { COLORS, SELECTION_ALPHA } from '../design/design-tokens.constants.ts';

export const EDITOR_THEME_NAME = 'goias-editor-infinito';

const hex = (color: string): string => color.slice(1);
const ALPHA_MAX = 255;
const HEX_RADIX = 16;
const selectionAlpha = Math.round(SELECTION_ALPHA * ALPHA_MAX).toString(HEX_RADIX).padStart(2, '0');

// Toda palavra goianesa acende em pequi; o resto do código fica neutro (frame.md: cor = significado).
export const EDITOR_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: hex(COLORS.pequi), fontStyle: 'bold' },
    { token: 'keyword.storage', foreground: hex(COLORS.pequi), fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: hex(COLORS.pequi) },
    { token: 'constant', foreground: hex(COLORS.pequi) },
    { token: 'type', foreground: hex(COLORS.pequi) },
    { token: 'support.function', foreground: hex(COLORS.pequi) },
    { token: 'string', foreground: hex(COLORS.string) },
    { token: 'comment', foreground: hex(COLORS.dim), fontStyle: 'italic' },
    { token: 'number', foreground: hex(COLORS.number) },
  ],
  colors: {
    'editor.background': COLORS.panel,
    'editor.foreground': COLORS.ink,
    'editorLineNumber.foreground': COLORS.dim,
    'editorLineNumber.activeForeground': COLORS.caret,
    'editorCursor.foreground': COLORS.caret,
    'editor.selectionBackground': `${COLORS.caret}${selectionAlpha}`,
    'editor.lineHighlightBackground': COLORS.grid,
    'editor.lineHighlightBorder': COLORS.grid,
    'editorIndentGuide.background1': COLORS.line,
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
