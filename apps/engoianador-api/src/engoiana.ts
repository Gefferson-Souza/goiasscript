import { GROQ_ENDPOINT, GROQ_MAX_TOKENS, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_TIMEOUT_MS, QUOTE_PAIRS, WORKERS_AI_MODEL } from './engoiana.constants';
import type { Env } from './env.types';
import type { GroqCompletion } from './groq.types';
import type { LogPort } from './log.types';
import { buildMessages } from './prompt';

function stripWrappingQuotes(value: string): string {
  const wrapped = QUOTE_PAIRS.some(([open, close]) => value.startsWith(open) && value.endsWith(close));
  return wrapped ? value.slice(1, -1).trim() : value;
}

async function callGroq(text: string, apiKey: string): Promise<string> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildMessages(text),
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      stream: false,
    }),
    // Sem o teto de tempo, uma Groq travada seguraria o Worker até o limite de CPU.
    signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Groq answered ${String(response.status)}`);
  }
  const data = await response.json<GroqCompletion>();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty answer from Groq');
  return stripWrappingQuotes(content);
}

async function callWorkersAi(text: string, env: Env): Promise<string> {
  if (!env.AI) throw new Error('Workers AI is not available');
  const output = (await env.AI.run(WORKERS_AI_MODEL, { messages: buildMessages(text) })) as { readonly response?: string };
  const content = output.response?.trim();
  if (!content) throw new Error('Empty answer from Workers AI');
  return stripWrappingQuotes(content);
}

async function tryGroq(text: string, env: Env, log: LogPort): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null;
  try {
    return await callGroq(text, env.GROQ_API_KEY);
  } catch (error) {
    log.warn('groq failed, trying workers ai', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function rewriteText(text: string, env: Env, log: LogPort): Promise<string> {
  const groqAnswer = await tryGroq(text, env, log);
  if (groqAnswer !== null) return groqAnswer;
  if (env.AI) return callWorkersAi(text, env);
  throw new Error('No LLM configured (GROQ_API_KEY or Workers AI)');
}
