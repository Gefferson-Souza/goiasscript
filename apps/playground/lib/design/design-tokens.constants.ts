import type { ColorToken } from './design-tokens.types.ts';

// Identidade "Editor Infinito" (video-studio/videos/goiasscript-lancamento/frame.md):
// cada cor diz o que a coisa É. Pequi é goianês, ciano é JavaScript, lavanda é o cursor.
// Os botões de ação principal são pequi porque a ação é dita em goianês ("Bota pra moer").
export const COLORS = {
  plane: '#06070C',
  grid: '#090B12',
  panel: '#0E1018',
  line: '#1C2030',
  edge: '#5E6690',
  ink: '#E8E6F0',
  dim: '#8A90AA',
  pequi: '#FFC93C',
  cyan: '#35E0FF',
  caret: '#A78BFF',
  error: '#FF5C7A',
  // Mesmo laranja dos números do código: aviso só aparece fora do editor, então não se confundem.
  warn: '#F78C6C',
  ok: '#3DF5A0',
  string: '#C3E88D',
  number: '#F78C6C',
} as const;

// `line` é só divisória decorativa; contorno de controle usa `edge` (≥ 3:1).
export const TEXT_PAIRS: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ['ink', 'plane'], ['ink', 'panel'], ['dim', 'plane'], ['dim', 'panel'],
  ['pequi', 'plane'], ['pequi', 'panel'], ['cyan', 'plane'], ['cyan', 'panel'],
  ['caret', 'plane'], ['caret', 'panel'], ['error', 'plane'], ['error', 'panel'],
  ['ok', 'panel'], ['string', 'panel'], ['number', 'panel'], ['plane', 'pequi'],
  ['warn', 'plane'], ['warn', 'panel'], ['plane', 'caret'],
];

export const UI_PAIRS: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ['edge', 'plane'], ['edge', 'panel'], ['caret', 'plane'], ['caret', 'panel'], ['pequi', 'panel'],
];

export const SELECTION_ALPHA = 0.28;

const ENTER_MS = 280;
const EXIT_MS = 180;
const CARET_TRAVEL_MS = 260;
const SWAP_MS = 420;

export const MOTION = {
  enterMs: ENTER_MS,
  exitMs: EXIT_MS,
  caretTravelMs: CARET_TRAVEL_MS,
  swapMs: SWAP_MS,
  curves: {
    settle: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    travel: 'cubic-bezier(0.65, 0, 0.35, 1)',
    leave: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const FONT_VARIABLES = {
  ui: '--font-space-grotesk',
  code: '--font-jetbrains-mono',
} as const;
