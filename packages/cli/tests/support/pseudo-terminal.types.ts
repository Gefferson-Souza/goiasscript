import type { ExitCode } from '../../src/exit-codes.types.ts';
import type { CliIo } from '../../src/io.types.ts';

export type PressedKey = 'tab' | 'ctrl-c' | 'ctrl-d';

export interface PseudoTerminal {
  readonly io: CliIo;
  readonly exitCode: Promise<ExitCode>;
  type(text: string): void;
  press(key: PressedKey): void;
  screen(): string;
  settled(): Promise<void>;
  closedYet(): boolean;
}
