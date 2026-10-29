import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { GroqModelList } from '../src/groq.types';
import {
  GROQ_MODELS_ENDPOINT,
  KEY_VARIABLE,
  MODEL_FLAG,
  MODEL_LINE_PATTERN,
  OUTCOME_MESSAGES,
  REQUIRE_FLAG,
  VERIFY_TIMEOUT_MS,
  WRANGLER_FILE,
} from './verify-model.constants.ts';
import type { RunVerifyModelOptions, VerifyModelOptions, VerifyModelOutcome, VerifyModelResult } from './verify-model.types';

async function fetchModelList(options: VerifyModelOptions, apiKey: string): Promise<GroqModelList | null> {
  try {
    const response = await options.fetchFn(GROQ_MODELS_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return await response.json<GroqModelList>();
  } catch {
    return null;
  }
}

export async function verifyModel(options: VerifyModelOptions): Promise<VerifyModelResult> {
  if (options.apiKey === undefined || options.apiKey === '') return { status: 'skipped' };
  const list = await fetchModelList(options, options.apiKey);
  if (list?.data === undefined) return { status: 'unreachable' };
  const entry = list.data.find((candidate) => candidate.id === options.model);
  if (entry === undefined) return { status: 'missing' };
  return { status: entry.active === false ? 'inactive' : 'ok' };
}

export async function runVerifyModel(options: RunVerifyModelOptions): Promise<VerifyModelOutcome> {
  const { status } = await verifyModel(options);
  switch (status) {
    case 'ok':
      return { exitCode: 0, message: OUTCOME_MESSAGES.ok(options.model) };
    case 'skipped':
      return options.require
        ? { exitCode: 1, message: OUTCOME_MESSAGES.skippedRequired() }
        : { exitCode: 0, message: OUTCOME_MESSAGES.skipped() };
    case 'missing':
      return { exitCode: 1, message: OUTCOME_MESSAGES.missing(options.model) };
    case 'inactive':
      return { exitCode: 1, message: OUTCOME_MESSAGES.inactive(options.model) };
    case 'unreachable':
      return { exitCode: 1, message: OUTCOME_MESSAGES.unreachable() };
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
    process.stderr.write('Não achei o GROQ_MODEL, sô.\n');
    process.exit(1);
  }
  const outcome = await runVerifyModel({
    apiKey: process.env[KEY_VARIABLE],
    model,
    require: args.includes(REQUIRE_FLAG),
    fetchFn: (url, init) => fetch(url, init),
  });
  process.stdout.write(`${outcome.message}\n`);
  process.exit(outcome.exitCode);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
