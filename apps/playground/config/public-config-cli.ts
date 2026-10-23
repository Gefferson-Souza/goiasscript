import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkDonationLinksOnline, assertPublicConfig } from './public-config.ts';
import { ENV_FILES, MESSAGES, ONLINE_FLAG } from './public-config.constants.ts';
import type { PublicConfigIo } from './public-config.types.ts';
import { resolveDonationLinks } from '../lib/donation-links.ts';
import type { ExternalDonation } from '../lib/donation-links.types.ts';

type Env = Readonly<Record<string, string | undefined>>;
type FetchFn = Parameters<typeof checkDonationLinksOnline>[1];

// `next build` lê os arquivos .env; o prebuild precisa enxergar os mesmos valores.
export function loadEnvFiles(cwd: string, load: (path: string) => void): void {
  for (const file of ENV_FILES) {
    const path = resolve(cwd, file);
    if (existsSync(path)) load(path);
  }
}

async function checkOnline(env: Env, io: PublicConfigIo, fetchFn: FetchFn): Promise<number> {
  const config = assertPublicConfig(env, 'production');
  const external = resolveDonationLinks(config).filter((link): link is ExternalDonation => link.kind !== 'pix');
  if (external.length === 0) {
    io.out(`${MESSAGES.noLinks}\n`);
    return 0;
  }
  const failures = await checkDonationLinksOnline(external, fetchFn);
  for (const failure of failures) io.err(`Ô sô! O link ${failure.label} ${failure.reason}.\n`);
  if (failures.length === 0) io.out(`${MESSAGES.linksOk}\n`);
  return failures.length === 0 ? 0 : 1;
}

export async function runPublicConfigCheck(
  args: readonly string[],
  env: Env,
  io: PublicConfigIo,
  fetchFn: FetchFn,
): Promise<number> {
  try {
    if (args.includes(ONLINE_FLAG)) return await checkOnline(env, io, fetchFn);
    assertPublicConfig(env, 'production');
    io.out(`${MESSAGES.configOk}\n`);
    return 0;
  } catch (error) {
    io.err(`${error instanceof Error ? error.message : MESSAGES.unexpectedFailure}\n`);
    return 1;
  }
}
