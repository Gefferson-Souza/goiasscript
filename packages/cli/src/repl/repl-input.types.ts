import type { Tone } from '@goiasscript/compiler';
import type { CliIo } from '../io.types.ts';
import type { ReplEngine } from './repl.types.ts';
import type { ReplTerminal } from './repl-controller.types.ts';

export interface ReplInputDeps {
  readonly io: Pick<CliIo, 'out' | 'err'>;
  readonly engine: ReplEngine;
  readonly terminal: ReplTerminal;
  readonly tone: Tone;
  readonly requestExit: () => void;
}

export interface ReplInput {
  processLine(line: string): Promise<void>;
  hasBufferedInput(): boolean;
  discardBuffer(): void;
  promptText(): string;
}
