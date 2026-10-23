import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GROQ_ENDPOINT } from '../src/engoiana.constants.ts';
import type { GroqCompletion, GroqModelList } from '../src/groq.types.ts';
import type { HealthReport } from '../src/ports.types.ts';
import type { FetchPort } from '../src/providers/provider.types.ts';
import {
  BASE_URL_VARIABLE,
  CONTRACT_MESSAGES,
  CONTRACT_PHRASE,
  CONTRACT_TIMEOUT_MS,
  HTTPS_PROTOCOL,
  JSON_HEADERS,
  KEY_VARIABLE,
  MAX_REDIRECTS,
  MINIMAL_MAX_TOKENS,
  MINIMAL_PROMPT,
  MODEL_FLAG,
  MODEL_LINE_PATTERN,
  REDIRECT_STATUS_MAX,
  REDIRECT_STATUS_MIN,
  SUMMARY_TEXT,
  SUMMARY_VARIABLE,
  WRANGLER_FILE,
} from './contract-check.constants.ts';
import type { ContractOptions, ContractResult } from './contract-check.types.ts';

const GROQ_MODELS_ENDPOINT = GROQ_ENDPOINT.replace(/chat\/completions$/u, 'models');

function isRedirect(response: Response): boolean {
  return response.status >= REDIRECT_STATUS_MIN && response.status <= REDIRECT_STATUS_MAX;
}

// A chamada segue redirecionamento à mão: a API nunca pode nos levar a outro host.
async function fetchSameHost(fetchFn: FetchPort, url: string, init: RequestInit): Promise<Response | null> {
  const host = new URL(url).host;
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchFn(current, { ...init, redirect: 'manual', signal: AbortSignal.timeout(CONTRACT_TIMEOUT_MS) });
    if (!isRedirect(response)) return response;
    const location = response.headers.get('Location');
    if (location === null) return null;
    const next = new URL(location, current);
    if (next.host !== host || next.protocol !== HTTPS_PROTOCOL) return null;
    current = next.href;
  }
  return null;
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json<T>();
  } catch {
    return null;
  }
}

async function checkGroq(options: ContractOptions, apiKey: string): Promise<readonly string[]> {
  const auth = { Authorization: `Bearer ${apiKey}` };
  try {
    const listing = await options.fetchFn(GROQ_MODELS_ENDPOINT, { headers: auth, signal: AbortSignal.timeout(CONTRACT_TIMEOUT_MS) });
    const list = listing.ok ? await readJson<GroqModelList>(listing) : null;
    if (list?.data === undefined) return [CONTRACT_MESSAGES.modelsUnreachable];
    if (!list.data.some((entry) => entry.id === options.model)) return [CONTRACT_MESSAGES.modelMissing(options.model)];
    const completion = await options.fetchFn(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { ...auth, ...JSON_HEADERS },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: MINIMAL_PROMPT }],
        max_tokens: MINIMAL_MAX_TOKENS,
        stream: false,
      }),
      signal: AbortSignal.timeout(CONTRACT_TIMEOUT_MS),
    });
    const data = completion.ok ? await readJson<GroqCompletion>(completion) : null;
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() !== '' ? [] : [CONTRACT_MESSAGES.completionEmpty];
  } catch {
    return [CONTRACT_MESSAGES.completionUnreachable];
  }
}

async function checkHealth(fetchFn: FetchPort, baseUrl: URL): Promise<readonly string[]> {
  try {
    const response = await fetchSameHost(fetchFn, new URL('health', baseUrl).href, { method: 'GET' });
    if (response === null) return [CONTRACT_MESSAGES.redirectOutsideHost];
    const report = response.ok ? await readJson<HealthReport>(response) : null;
    return report?.ok === true ? [] : [CONTRACT_MESSAGES.healthNotOk];
  } catch {
    return [CONTRACT_MESSAGES.healthUnreachable];
  }
}

async function checkEngoiana(fetchFn: FetchPort, baseUrl: URL): Promise<readonly string[]> {
  try {
    const response = await fetchSameHost(fetchFn, new URL('engoiana', baseUrl).href, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ text: CONTRACT_PHRASE }),
    });
    if (response === null) return [CONTRACT_MESSAGES.redirectOutsideHost];
    const body = response.ok ? await readJson<{ readonly text?: unknown }>(response) : null;
    const valid = typeof body?.text === 'string' && body.text.trim() !== '';
    return valid ? [] : [CONTRACT_MESSAGES.engoianaWrongShape];
  } catch {
    return [CONTRACT_MESSAGES.engoianaUnreachable];
  }
}

function parseBaseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.endsWith('/') ? raw : `${raw}/`);
    return url.protocol === HTTPS_PROTOCOL ? url : null;
  } catch {
    return null;
  }
}

async function checkApi(fetchFn: FetchPort, raw: string): Promise<readonly string[]> {
  const baseUrl = parseBaseUrl(raw);
  if (baseUrl === null) return [CONTRACT_MESSAGES.invalidBaseUrl];
  return [...(await checkHealth(fetchFn, baseUrl)), ...(await checkEngoiana(fetchFn, baseUrl))];
}

export async function runContractCheck(options: ContractOptions): Promise<ContractResult> {
  const { apiKey, baseUrl } = options;
  const hasKey = apiKey !== undefined && apiKey !== '';
  const hasUrl = baseUrl !== null && baseUrl !== '';
  if (!hasKey && !hasUrl) return { status: 'skipped', reason: CONTRACT_MESSAGES.skipped };
  const groqProblems = hasKey ? await checkGroq(options, apiKey) : [];
  const apiProblems = hasUrl ? await checkApi(options.fetchFn, baseUrl) : [];
  const problems = [...groqProblems, ...apiProblems];
  if (problems.length > 0) return { status: 'failed', problems };
  const pending = [...(hasKey ? [] : [CONTRACT_MESSAGES.groqPending]), ...(hasUrl ? [] : [CONTRACT_MESSAGES.apiPending])];
  return { status: 'passed', pending };
}

export function renderSummary(result: ContractResult): string {
  switch (result.status) {
    case 'passed':
      return SUMMARY_TEXT.passed(result.pending);
    case 'skipped':
      return SUMMARY_TEXT.skipped(result.reason);
    case 'failed':
      return SUMMARY_TEXT.failed(result.problems);
  }
}

function modelFrom(args: readonly string[]): string | undefined {
  const flagIndex = args.indexOf(MODEL_FLAG);
  if (flagIndex >= 0) return args[flagIndex + 1];
  const wrangler = fileURLToPath(new URL(`../${WRANGLER_FILE}`, import.meta.url));
  return MODEL_LINE_PATTERN.exec(readFileSync(wrangler, 'utf8'))?.[1];
}

async function main(args: readonly string[]): Promise<void> {
  const model = modelFrom(args);
  if (model === undefined) {
    process.stderr.write(`${CONTRACT_MESSAGES.modelNotFound}\n`);
    process.exit(1);
  }
  const result = await runContractCheck({
    apiKey: process.env[KEY_VARIABLE],
    baseUrl: process.env[BASE_URL_VARIABLE] ?? null,
    model,
    fetchFn: (url, init) => fetch(url, init),
  });
  const summary = renderSummary(result);
  process.stdout.write(`${summary}\n`);
  const summaryFile = process.env[SUMMARY_VARIABLE];
  if (summaryFile !== undefined && summaryFile !== '') appendFileSync(summaryFile, summary);
  process.exit(result.status === 'failed' ? 1 : 0);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
