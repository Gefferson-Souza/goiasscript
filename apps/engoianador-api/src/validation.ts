import { z } from 'zod';
import type { WorkerConfig } from './env.types';
import { HTTP_STATUS, JSON_MEDIA_TYPE } from './http.constants';
import { MESSAGES, inputTooLongMessage } from './messages.constants';
import { REQUEST_TEXT_FIELD } from './responses.constants';
import type { ParsedRequest, RejectionStatus } from './validation.types';

const CONTENT_LENGTH_PATTERN = /^\d+$/u;
const requestSchema = z.strictObject({ [REQUEST_TEXT_FIELD]: z.string().trim().min(1) });

function reject(status: RejectionStatus, error: string): ParsedRequest {
  return { ok: false, status, error };
}

function isJsonContentType(request: Request): boolean {
  const mediaType = (request.headers.get('Content-Type') ?? '').split(';')[0]?.trim().toLowerCase();
  return mediaType === JSON_MEDIA_TYPE;
}

function checkDeclaredLength(request: Request, maxBodyBytes: number): ParsedRequest | number {
  const declared = request.headers.get('Content-Length');
  if (declared === null) return reject(HTTP_STATUS.lengthRequired, MESSAGES.lengthRequired);
  if (!CONTENT_LENGTH_PATTERN.test(declared)) return reject(HTTP_STATUS.badRequest, MESSAGES.invalidLength);
  const length = Number(declared);
  return length > maxBodyBytes ? reject(HTTP_STATUS.payloadTooLarge, MESSAGES.bodyTooLarge) : length;
}

// Lê por fluxo e para ao passar do teto: o Content-Length declarado não é confiável.
async function readBoundedBody(request: Request, declaredLength: number, maxBodyBytes: number): Promise<Uint8Array | null> {
  if (request.body === null) return new Uint8Array(0);
  const limit = Math.min(declaredLength, maxBodyBytes);
  const reader = request.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const buffer = new Uint8Array(limit);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return buffer.subarray(0, received);
    if (received + value.byteLength > limit) {
      await reader.cancel();
      return null;
    }
    buffer.set(value, received);
    received += value.byteLength;
  }
}

function parseJson(bytes: Uint8Array): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)) as unknown };
  } catch {
    return { ok: false };
  }
}

export async function parseEngoianarRequest(request: Request, config: WorkerConfig): Promise<ParsedRequest> {
  if (!isJsonContentType(request)) return reject(HTTP_STATUS.unsupportedMediaType, MESSAGES.unsupportedMediaType);
  const declared = checkDeclaredLength(request, config.maxBodyBytes);
  if (typeof declared !== 'number') return declared;
  const bytes = await readBoundedBody(request, declared, config.maxBodyBytes);
  if (bytes === null) return reject(HTTP_STATUS.payloadTooLarge, MESSAGES.bodyTooLarge);
  const json = parseJson(bytes);
  if (!json.ok) return reject(HTTP_STATUS.badRequest, MESSAGES.invalidJson);
  const parsed = requestSchema.safeParse(json.value);
  if (!parsed.success) return reject(HTTP_STATUS.badRequest, MESSAGES.invalidBody);
  const text = parsed.data[REQUEST_TEXT_FIELD];
  return text.length > config.maxInputChars
    ? reject(HTTP_STATUS.payloadTooLarge, inputTooLongMessage(config.maxInputChars))
    : { ok: true, text };
}
