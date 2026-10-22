import { createIdleInterrupt } from './idle-interrupt.ts';
import { createLineDrain } from './line-drain.ts';
import { createReplInput } from './repl-input.ts';
import type { ReplController, ReplControllerDeps } from './repl-controller.types.ts';

export function createReplController(deps: ReplControllerDeps): ReplController {
  const { io, engine, terminal, tone } = deps;
  let exiting = false;
  const requestExit = (): void => {
    exiting = true;
    terminal.close();
  };
  const input = createReplInput({ io, engine, terminal, tone, requestExit });
  const showPrompt = (): void => {
    terminal.setPrompt(input.promptText());
    terminal.prompt();
  };
  const idle = createIdleInterrupt({ io, tone, input, requestExit, showPrompt });
  const lines = createLineDrain({
    processLine: (line) => input.processLine(line),
    onLine: () => {
      idle.disarm();
    },
    isStopped: () => exiting,
    onIdle: () => {
      if (!exiting) showPrompt();
    },
  });
  return {
    handleLine(line) {
      if (engine.hasPendingQuestion()) engine.answer(line);
      else lines.push(line);
    },
    handleInterrupt() {
      if (lines.current() === null) idle.interrupt();
      else engine.cancelPendingQuestion();
    },
    async finish() {
      if (engine.hasPendingQuestion()) engine.endOfInput();
      await lines.current();
      engine.endOfInput();
    },
  };
}
