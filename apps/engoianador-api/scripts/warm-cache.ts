import { pathToFileURL } from 'node:url';
import { PRESETS } from '../../playground/app/engoianador/engoianador.constants';
import { ENGOIANA_PATH, HTTPS_PROTOCOL, LOCAL_HOSTNAMES, WARM_MESSAGES, WARM_TIMEOUT_MS } from './warm-cache.constants';
import type { WarmCacheOptions, WarmCacheReport, WarmFailure } from './warm-cache.types';

function assertSafeBaseUrl(baseUrl: string): URL {
  try {
    const url = new URL(baseUrl);
    if (url.protocol === HTTPS_PROTOCOL || LOCAL_HOSTNAMES.has(url.hostname)) return url;
  } catch {
    throw new Error(WARM_MESSAGES.invalidUrl);
  }
  throw new Error(WARM_MESSAGES.invalidUrl);
}

async function warmOne(
  endpoint: string,
  preset: (typeof PRESETS)[number],
  options: WarmCacheOptions,
): Promise<WarmFailure | null> {
  try {
    const response = await options.fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: preset.text }),
      redirect: 'error',
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    });
    return response.ok ? null : { label: preset.label, reason: WARM_MESSAGES.status(response.status) };
  } catch {
    return { label: preset.label, reason: WARM_MESSAGES.networkDown };
  }
}

export async function warmCache(options: WarmCacheOptions): Promise<WarmCacheReport> {
  const endpoint = new URL(ENGOIANA_PATH, assertSafeBaseUrl(options.baseUrl)).href;
  const failed = await PRESETS.reduce<Promise<readonly WarmFailure[]>>(async (previous, preset) => {
    const accumulated = await previous;
    const failure = await warmOne(endpoint, preset, options);
    return failure === null ? accumulated : [...accumulated, failure];
  }, Promise.resolve([]));
  return { warmed: PRESETS.length - failed.length, failed };
}

async function main(args: readonly string[]): Promise<void> {
  const [baseUrl] = args;
  if (baseUrl === undefined) {
    process.stderr.write(`${WARM_MESSAGES.usage}\n`);
    process.exit(1);
  }
  const report = await warmCache({ baseUrl, fetchFn: (url, init) => fetch(url, init) });
  process.stdout.write(`${WARM_MESSAGES.done(report.warmed, PRESETS.length)}\n`);
  for (const failure of report.failed) process.stderr.write(`${WARM_MESSAGES.failure(failure.label, failure.reason)}\n`);
  process.exit(report.failed.length === 0 ? 0 : 1);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
