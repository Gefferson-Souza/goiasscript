import type { Tone } from '@goiasscript/compiler';
import type { CliIo } from '../io.types.ts';
import type { ReplInput } from './repl-input.types.ts';

export interface IdleInterruptDeps {
  readonly io: Pick<CliIo, 'out' | 'err'>;
  readonly tone: Tone;
  readonly input: Pick<ReplInput, 'hasBufferedInput' | 'discardBuffer'>;
  readonly requestExit: () => void;
  readonly showPrompt: () => void;
}

export interface IdleInterrupt {
  interrupt(): void;
  disarm(): void;
}
