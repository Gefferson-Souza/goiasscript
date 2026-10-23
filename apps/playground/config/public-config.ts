import { HEAD_TIMEOUT_MS, HTTP_OK_MIN, HTTP_REDIRECT_MAX, MESSAGES } from './public-config.constants.ts';
import type { LinkFailure } from './public-config.types.ts';
import { readSiteConfig } from './site-config.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';
import type { ExternalDonation } from '../lib/donation-links.types.ts';

type Env = Readonly<Record<string, string | undefined>>;
type FetchFn = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function assertPublicConfig(env: Env, mode: BuildMode): SiteConfig {
  return readSiteConfig(env, mode);
}

async function probe(link: ExternalDonation, fetchFn: FetchFn): Promise<LinkFailure | null> {
  try {
    const response = await fetchFn(link.href, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
    });
    const healthy = response.status >= HTTP_OK_MIN && response.status <= HTTP_REDIRECT_MAX;
    return healthy ? null : { label: link.label, reason: `${MESSAGES.badStatus} (${String(response.status)})` };
  } catch {
    return { label: link.label, reason: MESSAGES.unreachable };
  }
}

export async function checkDonationLinksOnline(
  links: readonly ExternalDonation[],
  fetchFn: FetchFn,
): Promise<readonly LinkFailure[]> {
  const results = await Promise.all(links.map((link) => probe(link, fetchFn)));
  return results.filter((result): result is LinkFailure => result !== null);
}
