import { LOG_STREAMS, MAX_LOG_MESSAGE_CHARS, MESSAGE_TYPES } from './protocol.constants.ts';
import type { LogStream, RunnerPort, RunnerToHost } from './protocol.types.ts';
import type { ExecuteMessage, ProgramEnvironment } from './run-program.types.ts';

type ConsoleMethod = (...values: readonly unknown[]) => void;

const OUT_METHODS = ['log', 'info', 'debug'] as const;
const ERR_METHODS = ['warn', 'error'] as const;
const CONSOLE_KEY = 'console';
const BLOB_TYPE = 'text/javascript';
const GENERIC_ERROR_NAME = 'Error';
const NULL_TEXT = 'nada';
const UNDEFINED_TEXT = 'indefinido';
const OPAQUE_OBJECT_TEXT = '[objeto]';
const FUNCTION_TEXT = '[função]';

export function isExecuteMessage(data: unknown): data is ExecuteMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === MESSAGE_TYPES.execute &&
    'runId' in data &&
    Number.isSafeInteger(data.runId) &&
    'code' in data &&
    typeof data.code === 'string'
  );
}

function formatValue(value: unknown): string {
  if (value === null) return NULL_TEXT;
  if (value === undefined) return UNDEFINED_TEXT;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return FUNCTION_TEXT;
  try {
    return JSON.stringify(value);
  } catch {
    return OPAQUE_OBJECT_TEXT;
  }
}

function createCollector(port: RunnerPort, runId: number): Readonly<Record<string, ConsoleMethod>> {
  const collect =
    (stream: LogStream): ConsoleMethod =>
    (...values) => {
      const text = values.map(formatValue).join(' ');
      port.postMessage({ type: MESSAGE_TYPES.log, runId, stream, text: text.slice(0, MAX_LOG_MESSAGE_CHARS) });
    };
  return Object.freeze({
    ...Object.fromEntries(OUT_METHODS.map((name) => [name, collect(LOG_STREAMS.out)])),
    ...Object.fromEntries(ERR_METHODS.map((name) => [name, collect(LOG_STREAMS.err)])),
  });
}

// O programa nunca recebe o console original: a propriedade nasce fechada e não aceita troca.
function installCollector(scope: object, collector: object): void {
  // eslint-disable-next-line functional/immutable-data -- trocar o console do escopo global é o objetivo desta função
  Object.defineProperty(scope, CONSOLE_KEY, { value: collector, writable: false, configurable: false, enumerable: false });
}

function readProperty(error: unknown, key: string): unknown {
  return typeof error === 'object' && error !== null && key in error ? (error as Readonly<Record<string, unknown>>)[key] : undefined;
}

function describeFailure(runId: number, error: unknown): RunnerToHost {
  const name = readProperty(error, 'name');
  const stack = readProperty(error, 'stack');
  const gsCode = readProperty(error, 'gsCode');
  const gsLine = readProperty(error, 'gsLine');
  return {
    type: MESSAGE_TYPES.failed,
    runId,
    stack: typeof stack === 'string' ? stack : typeof error === 'string' ? error : '',
    errorName: typeof name === 'string' ? name : GENERIC_ERROR_NAME,
    ...(typeof gsCode === 'string' ? { gsCode } : {}),
    ...(typeof gsLine === 'number' ? { gsLine } : {}),
  };
}

async function execute(port: RunnerPort, message: ExecuteMessage, environment: ProgramEnvironment): Promise<RunnerToHost> {
  const url = URL.createObjectURL(new Blob([message.code], { type: BLOB_TYPE }));
  try {
    installCollector(environment.scope, createCollector(port, message.runId));
    await environment.importModule(url);
    return { type: MESSAGE_TYPES.finished, runId: message.runId };
  } catch (error: unknown) {
    return describeFailure(message.runId, error);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function runProgram(port: RunnerPort, message: ExecuteMessage, environment: ProgramEnvironment): Promise<void> {
  port.postMessage(await execute(port, message, environment));
}
