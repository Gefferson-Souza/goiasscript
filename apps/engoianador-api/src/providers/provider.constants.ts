export const GROQ_PROVIDER_NAME = 'groq';
export const WORKERS_AI_PROVIDER_NAME = 'workers-ai';
export const NO_PROVIDER_NAME = 'none';

export const HTTP_CLIENT_ERROR_MIN = 400;
export const HTTP_SERVER_ERROR_MIN = 500;

export const MODEL_DISABLED_CODES: ReadonlySet<string> = new Set(['model_decommissioned', 'model_not_found', 'model_terms_required']);
export const TIMEOUT_ERROR_NAMES: ReadonlySet<string> = new Set(['TimeoutError', 'AbortError']);
