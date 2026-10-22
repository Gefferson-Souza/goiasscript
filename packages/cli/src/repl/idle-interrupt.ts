import type { IdleInterrupt, IdleInterruptDeps } from './idle-interrupt.types.ts';
import { exitHintText } from './repl-messages.ts';

export function createIdleInterrupt(deps: IdleInterruptDeps): IdleInterrupt {
  let armed = false;
  return {
    interrupt() {
      if (deps.input.hasBufferedInput()) {
        deps.input.discardBuffer();
        deps.io.out.write('\n');
      } else if (armed) {
        deps.requestExit();
        return;
      } else {
        armed = true;
        deps.io.err.write(`\n${exitHintText(deps.tone)}`);
      }
      deps.showPrompt();
    },
    disarm() {
      armed = false;
    },
  };
}
