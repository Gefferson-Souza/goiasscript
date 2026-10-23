export interface ExtensionIds {
  readonly publisher: string;
  readonly name: string;
  readonly version: string;
}

export interface SmokeResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<unknown>;
}

export interface SmokeRequestInit {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export type SmokeFetch = (url: string, init?: SmokeRequestInit) => Promise<SmokeResponse>;

export type SmokeRegistry = 'marketplace' | 'open-vsx';

export interface SmokeFailure {
  readonly registry: SmokeRegistry;
  readonly message: string;
}
