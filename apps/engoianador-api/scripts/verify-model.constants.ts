export const GROQ_MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';
export const VERIFY_TIMEOUT_MS = 10_000;
export const REQUIRE_FLAG = '--require';
export const MODEL_FLAG = '--model';
export const KEY_VARIABLE = 'GROQ_API_KEY';
export const WRANGLER_FILE = 'wrangler.toml';
export const MODEL_LINE_PATTERN = /^GROQ_MODEL\s*=\s*"([^"]+)"/m;

export const OUTCOME_MESSAGES = {
  ok: (model: string) => `Modelo ${model} tá ativo na Groq, sô.`,
  missing: (model: string) => `O modelo ${model} não existe na lista da Groq, ô rapaz. Troca o GROQ_MODEL.`,
  inactive: (model: string) => `O modelo ${model} tá desligado na Groq, ô rapaz. Troca o GROQ_MODEL.`,
  unreachable: () => 'Não deu pra consultar a lista de modelos da Groq, sô.',
  skipped: () => `Sem ${KEY_VARIABLE}, pulei a conferência do modelo. Roda de novo com a chave pra valer.`,
  skippedRequired: () => `Sem ${KEY_VARIABLE} e a conferência é obrigatória, sô.`,
} as const;
