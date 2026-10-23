import { FENCE_OPENING, LINE_BREAK } from './docs-gate.constants.ts';
import type { FencedBlock, ProseLine, ScannedMarkdown } from './docs-markdown.types.ts';

interface OpenFence {
  readonly ticks: number;
  readonly line: number;
  readonly tokens: readonly string[];
  readonly code: readonly string[];
}

interface ScanState {
  readonly open: OpenFence | null;
  readonly fenced: readonly FencedBlock[];
  readonly prose: readonly ProseLine[];
}

const closes = (text: string, ticks: number): boolean => new RegExp(`^ {0,3}\`{${String(ticks)},}\\s*$`, 'u').test(text);

function openFence(text: string, line: number): OpenFence | null {
  const match = FENCE_OPENING.exec(text);
  if (match === null) return null;
  const tokens = (match[2] ?? '').trim().split(/\s+/u).filter((token) => token !== '');
  return { ticks: (match[1] ?? '').length, line, tokens, code: [] };
}

function step(state: ScanState, text: string, index: number): ScanState {
  if (state.open === null) {
    const opened = openFence(text, index + 1);
    return opened === null ? { ...state, prose: [...state.prose, { line: index + 1, text }] } : { ...state, open: opened };
  }
  if (closes(text, state.open.ticks)) {
    const { line, tokens, code } = state.open;
    return { open: null, fenced: [...state.fenced, { line, tokens, code: code.join('\n') }], prose: state.prose };
  }
  return { ...state, open: { ...state.open, code: [...state.open.code, text] } };
}

// Bloco sem fechamento vai até o fim do arquivo, como no CommonMark.
export function scanMarkdown(markdown: string): ScannedMarkdown {
  const final = markdown.split(LINE_BREAK).reduce<ScanState>(step, { open: null, fenced: [], prose: [] });
  if (final.open === null) return { fenced: final.fenced, prose: final.prose };
  const { line, tokens, code } = final.open;
  return { fenced: [...final.fenced, { line, tokens, code: code.join('\n') }], prose: final.prose };
}
