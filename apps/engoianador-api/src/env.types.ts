export interface AiBinding {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface Env {
  readonly GROQ_API_KEY?: string | undefined;
  readonly GROQ_MODEL: string;
  readonly WORKERS_AI_MODEL: string;
  readonly AI?: AiBinding | undefined;
  readonly ALLOWED_ORIGINS: string;
  readonly RATE_LIMIT_PER_DAY: string;
  readonly GLOBAL_DAILY_CAP: string;
  readonly MAX_INPUT_CHARS: string;
  readonly MAX_BODY_BYTES: string;
  readonly CACHE_TTL_SEC: string;
  readonly KILL_SWITCH?: string | undefined;
  readonly ALLOW_UNLIMITED?: string | undefined;
  readonly QUOTA_LEDGER: DurableObjectNamespace;
  readonly ENGOIANADOR_CACHE: KVNamespace;
}

export interface WorkerConfig {
  readonly groqModel: string;
  readonly workersAiModel: string;
  readonly allowedOrigins: readonly string[];
  readonly rateLimitPerDay: number;
  readonly globalDailyCap: number;
  readonly maxInputChars: number;
  readonly maxBodyBytes: number;
  readonly cacheTtlSec: number;
  readonly killSwitch: boolean;
  readonly allowUnlimited: boolean;
}

export type ConfigResult =
  | { readonly ok: true; readonly config: WorkerConfig }
  | { readonly ok: false; readonly problems: readonly string[] };

export type EnvInput = { readonly [Key in keyof Env]?: Env[Key] | undefined };
