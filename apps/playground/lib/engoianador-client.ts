import {
  ENGOIANAR_PATH,
  HTTP_STATUS,
  JSON_HEADERS,
  MAX_INPUT_CHARS,
  REQUEST_TEXT_FIELD,
  REQUEST_TIMEOUT_MS,
  RESPONSE_TEXT_FIELDS,
} from './engoianador-client.constants.ts';
import type {
  EngoianadorFailureReason,
  EngoianadorResult,
  EngoianarOptions,
  FetchPort,
  FetchResponseLike,
} from './engoianador-client.types.ts';

const TRAILING_SLASHES = /\/+$/u;

function failure(reason: EngoianadorFailureReason): EngoianadorResult {
  return { ok: false, reason };
}

function failureForStatus(status: number): EngoianadorFailureReason {
  if (status === HTTP_STATUS.tooManyRequests) return 'rate-limited';
  const isClientError = status >= HTTP_STATUS.clientErrorMin && status <= HTTP_STATUS.clientErrorMax;
  return isClientError && status !== HTTP_STATUS.notFound ? 'invalid' : 'unavailable';
}

function extractText(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Readonly<Record<string, unknown>>;
  for (const field of RESPONSE_TEXT_FIELDS) {
    const value = record[field];
    if (typeof value === 'string' && value !== '') return value;
  }
  return null;
}

async function readText(response: FetchResponseLike): Promise<EngoianadorResult> {
  try {
    const text = extractText(await response.json());
    return text === null ? failure('unavailable') : { ok: true, text };
  } catch {
    return failure('unavailable');
  }
}

const defaultFetch: FetchPort = (url, init) => fetch(url, init);

export async function engoianar(text: string, options: EngoianarOptions): Promise<EngoianadorResult> {
  if (options.baseUrl === null) return failure('disabled');
  if (text.trim() === '' || text.length > MAX_INPUT_CHARS) return failure('invalid');
  const fetchFn = options.fetchFn ?? defaultFetch;
  const createTimeoutSignal = options.createTimeoutSignal ?? ((ms: number) => AbortSignal.timeout(ms));
  let response: FetchResponseLike;
  try {
    response = await fetchFn(`${options.baseUrl.replace(TRAILING_SLASHES, '')}${ENGOIANAR_PATH}`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ [REQUEST_TEXT_FIELD]: text }),
      credentials: 'omit',
      redirect: 'error',
      signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return failure('unavailable');
  }
  return response.ok ? readText(response) : failure(failureForStatus(response.status));
}
