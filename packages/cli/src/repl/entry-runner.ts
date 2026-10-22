import vm from 'node:vm';
import { translateRuntimeError } from '@goiasscript/compiler';
import { formatEcho } from './echo.ts';
import { ASYNC_WRAPPER_PATTERN, CANCELLED, INTERRUPTION_CODES, REPL_FILE_NAME } from './repl.constants.ts';
import type { EntryRequest, ReplEvaluation } from './repl.types.ts';

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';

const isInterruption = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' && INTERRUPTION_CODES.has(error.code);

function evaluateScript(request: EntryRequest): unknown {
  const { compiled, context, timeoutMs, cancellation } = request;
  const script = new vm.Script(compiled.code, { filename: REPL_FILE_NAME });
  const returned: unknown = script.runInContext(context, { breakOnSigint: true, ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }) });
  return ASYNC_WRAPPER_PATTERN.test(compiled.code) && isThenable(returned) ? Promise.race([returned, cancellation]) : returned;
}

export async function runEntry(request: EntryRequest): Promise<ReplEvaluation> {
  const { compiled, source, tone } = request;
  try {
    const value = await evaluateScript(request);
    if (value === CANCELLED) return { kind: 'cancelled' };
    const echo = compiled.echo ? formatEcho(value) : undefined;
    return { kind: 'done', diagnostics: compiled.diagnostics, ...(echo === undefined ? {} : { echo }) };
  } catch (error) {
    if (isInterruption(error)) return { kind: 'interrupted' };
    const context = { map: compiled.map, helperRange: compiled.helperRange, fileName: REPL_FILE_NAME, source };
    return { kind: 'threw', diagnostic: translateRuntimeError(error, context, tone), source };
  }
}
