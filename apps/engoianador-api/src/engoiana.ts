import { buildMessages } from './prompt';

export type Env = {
  GROQ_API_KEY?: string;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  MAX_INPUT_CHARS?: string;
  ENGOIANADOR_RL?: KVNamespace;
};

const GROQ_MODEL = 'llama-3.1-70b-versatile';
const WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export async function engoianarTexto(texto: string, env: Env): Promise<string> {
  if (env.GROQ_API_KEY) {
    try {
      return await callGroq(texto, env.GROQ_API_KEY);
    } catch (err) {
      console.warn('Groq falhou, tentando Workers AI:', err);
    }
  }
  if (env.AI) {
    return await callWorkersAI(texto, env);
  }
  throw new Error('Nenhuma LLM configurada (GROQ_API_KEY ou Workers AI)');
}

async function callGroq(texto: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildMessages(texto),
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Resposta vazia da Groq');
  return stripWrappingQuotes(content);
}

async function callWorkersAI(texto: string, env: Env): Promise<string> {
  if (!env.AI) throw new Error('Workers AI não disponível');
  const out = (await env.AI.run(WORKERS_AI_MODEL, {
    messages: buildMessages(texto),
  })) as { response?: string };
  const content = out?.response?.trim();
  if (!content) throw new Error('Resposta vazia do Workers AI');
  return stripWrappingQuotes(content);
}

function stripWrappingQuotes(s: string): string {
  // A LLM às vezes envolve a resposta em aspas. Remove se for o caso.
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith('“') && s.endsWith('”')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}
