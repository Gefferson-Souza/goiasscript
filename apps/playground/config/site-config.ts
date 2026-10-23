import { ALLOWED_PROTOCOLS, ENV_NAMES, MAX_PIX_KEY_LENGTH, MAX_URL_LENGTH, PUBLIC_ENV_PLACEHOLDERS } from './site-config.constants.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';

type Env = Readonly<Record<string, string | undefined>>;

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

const WHITESPACE = /\s/u;
const DUPLICATE_SLASHES = /\/{2,}/gu;

function configError(name: string, reason: string): ConfigError {
  return new ConfigError(`Ô sô! A variável ${name} tá errada: ${reason}`);
}

function readRaw(env: Env, name: string, mode: BuildMode): string | null {
  const value = env[name]?.trim() ?? '';
  if (value === '') return null;
  if (mode === 'production' && value === PUBLIC_ENV_PLACEHOLDERS[name]) {
    throw configError(name, 'ainda tá com o valor de exemplo do .env.example. Troca pelo valor de verdade.');
  }
  return value;
}

function normalizeUrl(raw: string, name: string, mode: BuildMode): string | null {
  const allowed = ALLOWED_PROTOCOLS[mode];
  const parsed = raw.length <= MAX_URL_LENGTH ? parseUrl(raw) : null;
  const reason = parsed === null ? 'não é uma URL válida.' : urlProblem(parsed, allowed);
  if (parsed === null || reason !== null) {
    if (mode === 'production') throw configError(name, reason ?? 'não é uma URL válida.');
    return null;
  }
  return `${parsed.origin}${parsed.pathname.replace(DUPLICATE_SLASHES, '/')}${parsed.search}${parsed.hash}`;
}

function urlProblem(url: URL, allowed: readonly string[]): string | null {
  if (!allowed.includes(url.protocol)) return `só vale ${allowed.join(' ou ')}.`;
  if (url.username !== '' || url.password !== '') return 'não pode levar usuário e senha na URL.';
  return null;
}

function readUrl(env: Env, name: string, mode: BuildMode): string | null {
  const raw = readRaw(env, name, mode);
  return raw === null ? null : normalizeUrl(raw, name, mode);
}

function readPixKey(env: Env, mode: BuildMode): string | null {
  const name = ENV_NAMES.pixKey;
  const raw = readRaw(env, name, mode);
  if (raw === null) return null;
  const invalid = raw.length > MAX_PIX_KEY_LENGTH || WHITESPACE.test(raw);
  if (!invalid) return raw;
  if (mode === 'production') throw configError(name, 'a chave Pix não pode ter espaço nem passar de 140 caracteres.');
  return null;
}

export function readSiteConfig(env: Env, mode: BuildMode): SiteConfig {
  return {
    siteUrl: readUrl(env, ENV_NAMES.siteUrl, mode),
    engoianadorUrl: readUrl(env, ENV_NAMES.engoianadorUrl, mode),
    donation: {
      pixKey: readPixKey(env, mode),
      sponsorsUrl: readUrl(env, ENV_NAMES.sponsorsUrl, mode),
      kofiUrl: readUrl(env, ENV_NAMES.kofiUrl, mode),
    },
    contactUrl: readUrl(env, ENV_NAMES.contactUrl, mode),
  };
}
