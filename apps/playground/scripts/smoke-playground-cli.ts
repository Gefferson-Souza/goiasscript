import { CLI_MESSAGES, EXIT_OK, EXIT_SMOKE_FAILED, EXIT_USAGE, REQUIRED_PROTOCOL } from './smoke-playground.constants.ts';
import { runSmoke } from './smoke-playground.ts';
import type { SmokeCliIo } from './smoke-playground.types.ts';

function parseBaseUrl(candidate: string): URL | null {
  try {
    const url = new URL(candidate);
    return url.protocol === REQUIRED_PROTOCOL ? url : null;
  } catch {
    return null;
  }
}

export async function runSmokeCli(args: readonly string[], io: SmokeCliIo, fetchFn: typeof fetch): Promise<number> {
  const [candidate] = args;
  if (candidate === undefined) {
    io.err(`${CLI_MESSAGES.missingUrl}\n`);
    return EXIT_USAGE;
  }
  const baseUrl = parseBaseUrl(candidate);
  if (baseUrl === null) {
    io.err(`${CLI_MESSAGES.invalidUrl}\n`);
    return EXIT_USAGE;
  }
  const failures = await runSmoke(baseUrl.href, fetchFn);
  for (const failure of failures) io.err(`Eita! ${failure.path}: ${failure.message}\n`);
  if (failures.length > 0) return EXIT_SMOKE_FAILED;
  io.out(`${CLI_MESSAGES.success}\n`);
  return EXIT_OK;
}
