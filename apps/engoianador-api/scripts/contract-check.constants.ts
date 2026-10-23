export const CONTRACT_TIMEOUT_MS = 15_000;
export const MAX_REDIRECTS = 3;
export const REDIRECT_STATUS_MIN = 300;
export const REDIRECT_STATUS_MAX = 399;
export const HTTPS_PROTOCOL = 'https:';
export const BASE_URL_VARIABLE = 'ENGOIANADOR_URL';
export const KEY_VARIABLE = 'GROQ_API_KEY';
export const SUMMARY_VARIABLE = 'GITHUB_STEP_SUMMARY';
export const MODEL_FLAG = '--model';
export const WRANGLER_FILE = 'wrangler.toml';
export const MODEL_LINE_PATTERN = /^GROQ_MODEL\s*=\s*"([^"]+)"/m;
export const MINIMAL_PROMPT = 'Diga oi.';
export const MINIMAL_MAX_TOKENS = 8;
export const CONTRACT_PHRASE = 'Isso é um teste de contrato.';
export const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export const CONTRACT_MESSAGES = {
  skipped: `Sem ${KEY_VARIABLE} e sem ${BASE_URL_VARIABLE}, não tem o que conferir, sô. Configura os dois pra valer.`,
  invalidBaseUrl: `${BASE_URL_VARIABLE} tem que ser um endereço https, ô rapaz.`,
  modelMissing: (model: string) => `A Groq não lista o modelo ${model}, ô rapaz.`,
  modelsUnreachable: 'Não deu pra consultar a lista de modelos da Groq, sô.',
  completionEmpty: 'A Groq não respondeu a completação mínima, sô.',
  completionUnreachable: 'A completação mínima na Groq deu ruim, sô.',
  healthNotOk: 'O /health da API não veio ok, ô rapaz.',
  healthUnreachable: 'Não deu pra consultar o /health da API, sô.',
  engoianaWrongShape: 'O POST /engoiana não devolveu { "text": "..." }, ô rapaz.',
  engoianaUnreachable: 'O POST /engoiana da API deu ruim, sô.',
  redirectOutsideHost: 'A API mandou redirecionar pra outro host, ô rapaz. Não sigo.',
  groqPending: 'Groq: pendente do dono (falta GROQ_API_KEY).',
  apiPending: 'API: pendente do dono (falta ENGOIANADOR_URL).',
  modelNotFound: 'Não achei o GROQ_MODEL, sô.',
} as const;

export const SUMMARY_TEXT = {
  passed: (pending: readonly string[]) =>
    pending.length === 0
      ? '## Contrato do Engoianador\n\nTá bão, sô: contrato conferido.\n'
      : `## Contrato do Engoianador\n\nTá bão, sô, mas só uma metade foi conferida:\n\n${pending.map((item) => `- ${item}`).join('\n')}\n\nEstado: pendente do dono\n`,
  skipped: (reason: string) => `## Contrato do Engoianador\n\nPendente do dono: ${reason}\n\nEstado: pendente do dono\n`,
  failed: (problems: readonly string[]) =>
    `## Contrato do Engoianador\n\nDeu ruim:\n\n${problems.map((problem) => `- ${problem}`).join('\n')}\n`,
} as const;
