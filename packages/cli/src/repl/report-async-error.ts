import { translateRuntimeError } from '@goiasscript/compiler';
import type { Tone } from '@goiasscript/compiler';
import { sanitizeForTerminal } from '../diagnostics/sanitize-terminal.ts';
import type { CliIo } from '../io.types.ts';
import { REPL_FILE_NAME } from './repl.constants.ts';

export function createAsyncErrorReporter(io: Pick<CliIo, 'err'>, tone: Tone): (error: unknown) => void {
  return (error) => {
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: null, fileName: REPL_FILE_NAME, source: '' }, tone);
    const help = diagnostic.help === undefined ? '' : `${sanitizeForTerminal(diagnostic.help)}\n`;
    io.err.write(`${sanitizeForTerminal(diagnostic.message)}\n${help}`);
  };
}
