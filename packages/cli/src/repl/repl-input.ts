import { toPrintable } from '../args/printable-text.ts';
import { appendLine, bufferSource, EMPTY_LINE_BUFFER, isBufferEmpty } from './line-buffer.ts';
import { HISTORY_LIMIT } from './repl.constants.ts';
import type { ReplCommandId } from './repl-commands.types.ts';
import { parseReplCommand } from './repl-commands.ts';
import { formatBindings, formatHistory } from './repl-listing.ts';
import {
  CONTINUATION_PROMPT, emptyBindingsText, emptyHistoryText, helpText, MAIN_PROMPT, resetText, unknownCommandText,
} from './repl-messages.ts';
import { isAccepted, reportEvaluation } from './repl-report.ts';
import type { ReplInput, ReplInputDeps } from './repl-input.types.ts';

export function createReplInput(deps: ReplInputDeps): ReplInput {
  const { io, engine, terminal, tone } = deps;
  let buffer = EMPTY_LINE_BUFFER;
  let history: readonly string[] = [];

  const runCommand = (id: ReplCommandId): void => {
    const { bindings } = engine.session;
    if (id === 'exit') deps.requestExit();
    else if (id === 'help') io.out.write(helpText(tone));
    else if (id === 'clear') terminal.clearScreen();
    else if (id === 'bindings') io.out.write(bindings.length === 0 ? emptyBindingsText(tone) : formatBindings(bindings));
    else if (id === 'history') io.out.write(history.length === 0 ? emptyHistoryText(tone) : formatHistory(history));
    else {
      engine.reset();
      history = [];
      io.out.write(resetText(tone));
    }
  };

  const evaluateBuffer = async (): Promise<void> => {
    const source = bufferSource(buffer);
    terminal.setRawMode(false);
    const pending = engine.evaluate(source);
    terminal.setRawMode(true);
    const result = await pending;
    if (result.kind === 'incomplete') return;
    buffer = EMPTY_LINE_BUFFER;
    if (isAccepted(result)) history = [...history.slice(1 - HISTORY_LIMIT), source];
    reportEvaluation(io, tone, result, source);
  };

  return {
    async processLine(line) {
      const command = isBufferEmpty(buffer) ? parseReplCommand(line) : null;
      if (command?.kind === 'command') runCommand(command.id);
      else if (command?.kind === 'unknown') io.err.write(unknownCommandText(tone, toPrintable(command.typed), command.suggestion));
      else if (!isBufferEmpty(buffer) || line.trim() !== '') {
        buffer = appendLine(buffer, line);
        await evaluateBuffer();
      }
    },
    hasBufferedInput: () => !isBufferEmpty(buffer),
    discardBuffer() {
      buffer = EMPTY_LINE_BUFFER;
    },
    promptText: () => (isBufferEmpty(buffer) ? MAIN_PROMPT : CONTINUATION_PROMPT),
  };
}
