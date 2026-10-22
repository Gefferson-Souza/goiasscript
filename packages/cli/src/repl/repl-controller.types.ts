import type { Tone } from '@goiasscript/compiler';
import type { CliIo } from '../io.types.ts';
import type { ReplEngine } from './repl.types.ts';

export interface ReplTerminal {
  setPrompt(text: string): void;
  prompt(): void;
  clearScreen(): void;
  setRawMode(enabled: boolean): void;
  close(): void;
}

export interface ReplControllerDeps {
  readonly io: Pick<CliIo, 'out' | 'err'>;
  readonly engine: ReplEngine;
  readonly terminal: ReplTerminal;
  readonly tone: Tone;
}

export interface ReplController {
  handleLine(line: string): void;
  handleInterrupt(): void;
  finish(): Promise<void>;
}
