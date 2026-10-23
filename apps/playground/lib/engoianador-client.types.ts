export type EngoianadorFailureReason = 'disabled' | 'rate-limited' | 'invalid' | 'unavailable';

export type EngoianadorResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: EngoianadorFailureReason };

export interface FetchResponseLike {
  readonly status: number;
  readonly ok: boolean;
  json(): Promise<unknown>;
}

export interface FetchRequestInit {
  readonly method: 'GET' | 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly credentials: 'omit';
  readonly redirect: 'error';
  readonly signal: AbortSignal;
}

export type FetchPort = (url: string, init: FetchRequestInit) => Promise<FetchResponseLike>;

export interface EngoianarOptions {
  readonly baseUrl: string | null;
  readonly fetchFn?: FetchPort;
  readonly createTimeoutSignal?: (timeoutMs: number) => AbortSignal;
}

export type EngoianadorHealth = 'up' | 'down' | 'disabled';
