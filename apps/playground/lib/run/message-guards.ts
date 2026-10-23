import type { RunLimits } from '../../config/run-limits.types.ts';
import { LOG_STREAMS, MAX_ERROR_CODE_CHARS, MAX_ERROR_NAME_CHARS, MAX_STACK_CHARS, MESSAGE_TYPES } from '../../sandbox/protocol.constants.ts';
import type { LogStream, RunnerToHost } from '../../sandbox/protocol.types.ts';

type UnknownRecord = Readonly<Record<string, unknown>>;
type MessageParser = (record: UnknownRecord, limits: RunLimits) => RunnerToHost | null;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

// Só propriedade própria vale: protótipo poluído pelo programa do aluno não pode preencher campo ausente.
const own = (record: UnknownRecord, key: string): unknown => (Object.hasOwn(record, key) ? record[key] : undefined);

const runIdOf = (record: UnknownRecord): number | null => {
  const value = own(record, 'runId');
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
};

const textOf = (record: UnknownRecord, key: string, maxChars: number): string | null => {
  const value = own(record, key);
  return typeof value === 'string' ? value.slice(0, maxChars) : null;
};

const streamOf = (record: UnknownRecord): LogStream | null => {
  const value = own(record, 'stream');
  return value === LOG_STREAMS.out || value === LOG_STREAMS.err ? value : null;
};

const parseLog: MessageParser = (record, limits) => {
  const runId = runIdOf(record);
  const stream = streamOf(record);
  const text = textOf(record, 'text', Number.MAX_SAFE_INTEGER);
  if (runId === null || stream === null || text === null) return null;
  return { type: MESSAGE_TYPES.log, runId, stream, text: text.length > limits.maxLogChars ? text.slice(0, limits.maxLogChars + 1) : text };
};

const parseAsk: MessageParser = (record, limits) => {
  const prompt = textOf(record, 'prompt', limits.maxPromptChars);
  return prompt === null ? null : { type: MESSAGE_TYPES.ask, prompt };
};

const parseFinished: MessageParser = (record) => {
  const runId = runIdOf(record);
  return runId === null ? null : { type: MESSAGE_TYPES.finished, runId };
};

const parseFailed: MessageParser = (record) => {
  const runId = runIdOf(record);
  const stack = textOf(record, 'stack', MAX_STACK_CHARS);
  const errorName = textOf(record, 'errorName', MAX_ERROR_NAME_CHARS);
  if (runId === null || stack === null || errorName === null) return null;
  const gsCode = textOf(record, 'gsCode', MAX_ERROR_CODE_CHARS);
  const gsLine = own(record, 'gsLine');
  return {
    type: MESSAGE_TYPES.failed,
    runId,
    stack,
    errorName,
    ...(gsCode === null ? {} : { gsCode }),
    ...(typeof gsLine === 'number' && Number.isSafeInteger(gsLine) && gsLine >= 0 ? { gsLine } : {}),
  };
};

const PARSERS: ReadonlyMap<string, MessageParser> = new Map<string, MessageParser>([
  [MESSAGE_TYPES.ready, () => ({ type: MESSAGE_TYPES.ready })],
  [MESSAGE_TYPES.log, parseLog],
  [MESSAGE_TYPES.ask, parseAsk],
  [MESSAGE_TYPES.finished, parseFinished],
  [MESSAGE_TYPES.failed, parseFailed],
]);

// Tudo que o Worker diz é dado hostil: o host reconstrói a mensagem campo a campo e descarta o resto.
export function parseRunnerMessage(data: unknown, limits: RunLimits): RunnerToHost | null {
  if (!isRecord(data)) return null;
  const type = own(data, 'type');
  return typeof type === 'string' ? (PARSERS.get(type)?.(data, limits) ?? null) : null;
}
