import { QUOTE_PAIRS } from '../engoiana.constants';
import type { ProviderFailure, ProviderResult } from '../ports.types';
import { TIMEOUT_ERROR_NAMES } from './provider.constants';

function stripWrappingQuotes(value: string): string {
  const wrapped = QUOTE_PAIRS.some(([open, close]) => value.length > 1 && value.startsWith(open) && value.endsWith(close));
  return wrapped ? value.slice(1, -1).trim() : value;
}

export function answerFrom(provider: string, raw: string | undefined): ProviderResult {
  const content = raw?.trim() ?? '';
  const text = stripWrappingQuotes(content);
  if (text === '') return failureOf(provider, 'empty');
  return { ok: true, text, provider };
}

export function failureOf(provider: string, failure: ProviderFailure): ProviderResult {
  return { ok: false, failure, provider };
}

export function failureFromError(provider: string, error: unknown): ProviderResult {
  const name = error instanceof Error ? error.name : '';
  return failureOf(provider, TIMEOUT_ERROR_NAMES.has(name) ? 'timeout' : 'server-error');
}
