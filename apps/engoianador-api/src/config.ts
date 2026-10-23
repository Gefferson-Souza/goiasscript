import {
  FLAG_ON,
  HTTPS_PROTOCOL,
  HTTP_PROTOCOL,
  LOCAL_HOSTNAMES,
  ORIGIN_SEPARATOR,
  POSITIVE_INTEGER_PATTERN,
  REQUIRED_BINDINGS,
} from './config.constants';
import type { ConfigResult, EnvInput } from './env.types';

type Parsed<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problems: readonly string[] };

type IntegerVariable = 'RATE_LIMIT_PER_DAY' | 'GLOBAL_DAILY_CAP' | 'MAX_INPUT_CHARS' | 'MAX_BODY_BYTES' | 'CACHE_TTL_SEC';
type TextVariable = 'GROQ_MODEL' | 'WORKERS_AI_MODEL';

function readInteger(env: EnvInput, name: IntegerVariable): Parsed<number> {
  const raw = env[name];
  if (typeof raw === 'string' && POSITIVE_INTEGER_PATTERN.test(raw.trim())) {
    return { ok: true, value: Number(raw.trim()) };
  }
  return { ok: false, problems: [`${name} tem que ser um número inteiro maior que zero, sô.`] };
}

function readText(env: EnvInput, name: TextVariable): Parsed<string> {
  const raw = env[name];
  if (typeof raw === 'string' && raw.trim() !== '') return { ok: true, value: raw.trim() };
  return { ok: false, problems: [`${name} tá vazio, sô.`] };
}

function isAllowedOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.origin !== value) return false;
    if (url.protocol === HTTPS_PROTOCOL) return true;
    return url.protocol === HTTP_PROTOCOL && LOCAL_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

function readOrigins(env: EnvInput): Parsed<readonly string[]> {
  const origins = (env.ALLOWED_ORIGINS ?? '')
    .split(ORIGIN_SEPARATOR)
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
  const invalid = origins.filter((origin) => !isAllowedOrigin(origin));
  if (origins.length === 0) return { ok: false, problems: ['ALLOWED_ORIGINS não tem nenhuma origem, sô.'] };
  if (invalid.length > 0) {
    return { ok: false, problems: [`ALLOWED_ORIGINS só aceita https (ou http em localhost): ${invalid.join(', ')}.`] };
  }
  return { ok: true, value: origins };
}

function missingBindings(env: EnvInput): readonly string[] {
  return REQUIRED_BINDINGS.filter((name) => env[name] === undefined).map((name) => `O binding ${name} não tá configurado, sô.`);
}

function collectProblems(results: readonly Parsed<unknown>[]): readonly string[] {
  return results.flatMap((result) => (result.ok ? [] : result.problems));
}

export function parseConfig(env: EnvInput): ConfigResult {
  const rateLimitPerDay = readInteger(env, 'RATE_LIMIT_PER_DAY');
  const globalDailyCap = readInteger(env, 'GLOBAL_DAILY_CAP');
  const maxInputChars = readInteger(env, 'MAX_INPUT_CHARS');
  const maxBodyBytes = readInteger(env, 'MAX_BODY_BYTES');
  const cacheTtlSec = readInteger(env, 'CACHE_TTL_SEC');
  const groqModel = readText(env, 'GROQ_MODEL');
  const workersAiModel = readText(env, 'WORKERS_AI_MODEL');
  const allowedOrigins = readOrigins(env);
  if (
    !rateLimitPerDay.ok || !globalDailyCap.ok || !maxInputChars.ok || !maxBodyBytes.ok ||
    !cacheTtlSec.ok || !groqModel.ok || !workersAiModel.ok || !allowedOrigins.ok
  ) {
    const parsed = [rateLimitPerDay, globalDailyCap, maxInputChars, maxBodyBytes, cacheTtlSec, groqModel, workersAiModel, allowedOrigins];
    return { ok: false, problems: [...collectProblems(parsed), ...missingBindings(env)] };
  }
  const bindingProblems = missingBindings(env);
  if (bindingProblems.length > 0) return { ok: false, problems: bindingProblems };
  return {
    ok: true,
    config: {
      groqModel: groqModel.value,
      workersAiModel: workersAiModel.value,
      allowedOrigins: allowedOrigins.value,
      rateLimitPerDay: rateLimitPerDay.value,
      globalDailyCap: globalDailyCap.value,
      maxInputChars: maxInputChars.value,
      maxBodyBytes: maxBodyBytes.value,
      cacheTtlSec: cacheTtlSec.value,
      killSwitch: env.KILL_SWITCH === FLAG_ON,
    },
  };
}
