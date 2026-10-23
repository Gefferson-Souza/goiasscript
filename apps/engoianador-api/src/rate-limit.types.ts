export type RateLimitResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'rate'; readonly retryAfterSec: number }
  | { readonly ok: false; readonly reason: 'misconfig' };
