export type QuotaDecision =
  | { readonly ok: true; readonly reservation: string }
  | { readonly ok: false; readonly reason: 'rate' | 'global' | 'kill-switch' | 'misconfig'; readonly retryAfterSec: number };

export interface QuotaLimiter {
  reserve(networkKey: string, nowSec: number): Promise<QuotaDecision>;
  refund(reservation: string): Promise<void>;
}

export type ProviderFailure = 'client-error' | 'server-error' | 'timeout' | 'model-disabled' | 'empty';

export type ProviderResult =
  | { readonly ok: true; readonly text: string; readonly provider: string }
  | { readonly ok: false; readonly failure: ProviderFailure; readonly provider: string };

export interface ProviderChain {
  complete(text: string, signal: AbortSignal): Promise<ProviderResult>;
}

export interface ResponseCache {
  get(text: string): Promise<string | null>;
  put(text: string, answer: string): Promise<void>;
}

export interface HealthReport {
  readonly ok: boolean;
  readonly model: string;
  readonly bindings: Readonly<Record<string, boolean>>;
}
