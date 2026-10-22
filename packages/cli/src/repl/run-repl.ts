import readline from 'node:readline';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import { VERSION } from '../version.ts';
import { completeLine } from './completer.ts';
import { createReplEngine } from './engine.ts';
import type { ReplOptions } from './repl.types.ts';
import { createReplController } from './repl-controller.ts';
import type { ReplTerminal } from './repl-controller.types.ts';
import { bannerText, MAIN_PROMPT } from './repl-messages.ts';

interface RawCapable {
  setRawMode(enabled: boolean): unknown;
}

const isRawCapable = (input: object): input is RawCapable => 'setRawMode' in input && typeof input.setRawMode === 'function';

function createTerminal(io: CliIo, rl: readline.Interface): ReplTerminal {
  const { input, output, isTty } = io.streams;
  return {
    setPrompt(text) {
      rl.setPrompt(text);
    },
    prompt() {
      if (isTty) rl.prompt();
    },
    clearScreen() {
      if (!isTty) return;
      readline.cursorTo(output, 0, 0);
      readline.clearScreenDown(output);
    },
    setRawMode(enabled) {
      if (isTty && isRawCapable(input)) input.setRawMode(enabled);
    },
    close() {
      rl.close();
    },
  };
}

export function runRepl(io: CliIo, options: ReplOptions): Promise<ExitCode> {
  const engine = createReplEngine({ io, ...options });
  const rl = readline.createInterface({
    input: io.streams.input,
    output: io.streams.output,
    terminal: io.streams.isTty,
    prompt: MAIN_PROMPT,
    completer: (line: string): [string[], string] => {
      const [hits, token] = completeLine(line, engine.session.bindings);
      return [[...hits], token];
    },
  });
  const controller = createReplController({ io, engine, terminal: createTerminal(io, rl), tone: options.tone });
  rl.on('line', (line) => {
    controller.handleLine(line);
  });
  rl.on('SIGINT', () => {
    controller.handleInterrupt();
  });
  if (io.streams.isTty) {
    io.out.write(bannerText(options.tone, VERSION));
    rl.prompt();
  }
  return new Promise<ExitCode>((resolve) => {
    rl.on('close', () => {
      void controller.finish().then(() => {
        resolve(EXIT_CODE.ok);
      });
    });
  });
}
