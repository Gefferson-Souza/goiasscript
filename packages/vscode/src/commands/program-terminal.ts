import type { ExtensionHost } from '../host/extension-host.types.ts';
import { TERMINAL_NEWLINE } from '../host/host.constants.ts';
import { BACKSPACE, CTRL_C, ENTER_KEYS, ERASE_ONE_CHARACTER } from './commands.constants.ts';
import type { LineTerminal } from './commands.types.ts';
import { sanitizeTerminalText, stripEscapeSequences } from './sanitize-terminal-text.ts';

const NEWLINE_PATTERN = /\r?\n/gu;

interface KeyEffect {
  readonly buffer: string;
  readonly echo: string;
  readonly line?: string;
  readonly interrupt?: true;
}

const toTerminalText = (text: string): string => sanitizeTerminalText(text).replace(NEWLINE_PATTERN, TERMINAL_NEWLINE);

function applyKey(buffer: string, character: string): KeyEffect {
  if (character === CTRL_C) return { buffer, echo: '', interrupt: true };
  if (ENTER_KEYS.has(character)) return { buffer: '', echo: TERMINAL_NEWLINE, line: buffer };
  if (character === BACKSPACE) return buffer === '' ? { buffer, echo: '' } : { buffer: Array.from(buffer).slice(0, -1).join(''), echo: ERASE_ONE_CHARACTER };
  const safe = sanitizeTerminalText(character);
  return { buffer: `${buffer}${safe}`, echo: safe };
}

// O pseudoterminal não ecoa nem edita linha: o eco, o backspace e o Enter ficam por conta da extensão.
export function createProgramTerminal(host: ExtensionHost, title: string): LineTerminal {
  const terminal = host.openProgramTerminal(sanitizeTerminalText(title));
  let buffer = '';
  let lineHandlers: readonly ((line: string) => void)[] = [];
  let interruptHandlers: readonly (() => void)[] = [];
  terminal.onInput((data) => {
    for (const character of stripEscapeSequences(data)) {
      const effect = applyKey(buffer, character);
      buffer = effect.buffer;
      if (effect.echo !== '') terminal.write(effect.echo);
      if (effect.line !== undefined) lineHandlers.forEach((handler) => { handler(effect.line ?? ''); });
      if (effect.interrupt === true) interruptHandlers.forEach((handler) => { handler(); });
    }
  });
  return {
    write: (text) => {
      terminal.write(toTerminalText(text));
    },
    onLine: (handler) => {
      lineHandlers = [...lineHandlers, handler];
    },
    onInterrupt: (handler) => {
      interruptHandlers = [...interruptHandlers, handler];
    },
    onClose: (handler) => {
      terminal.onClose(handler);
    },
    close: (exitCode) => {
      terminal.close(exitCode);
    },
  };
}
