import {
  FIRST_BYTE_RANGE,
  HEAD_TIMEOUT_MS,
  HTTP_FORBIDDEN,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_OK_MIN,
  HTTP_REDIRECT_MAX,
  MESSAGES,
  PROBE_USER_AGENT,
} from './public-config.constants.ts';
import type { LinkFailure } from './public-config.types.ts';
import { readSiteConfig } from './site-config.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';
import type { ExternalDonation } from '../lib/donation-links.types.ts';

type Env = Readonly<Record<string, string | undefined>>;
type FetchFn = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function assertPublicConfig(env: Env, mode: BuildMode): SiteConfig {
  return readSiteConfig(env, mode);
}

const HEAD_REJECTED_STATUSES: readonly number[] = [HTTP_FORBIDDEN, HTTP_METHOD_NOT_ALLOWED];

function request(fetchFn: FetchFn, href: string, method: 'HEAD' | 'GET'): Promise<Response> {
  const headers = method === 'GET' ? { 'User-Agent': PROBE_USER_AGENT, Range: FIRST_BYTE_RANGE } : { 'User-Agent': PROBE_USER_AGENT };
  return fetchFn(href, { method, headers, redirect: 'manual', signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
}

async function probe(link: ExternalDonation, fetchFn: FetchFn): Promise<LinkFailure | null> {
  try {
    let response = await request(fetchFn, link.href, 'HEAD');
    // Ko-fi (Cloudflare) e GitHub costumam recusar HEAD vindo de IP de CI.
    if (HEAD_REJECTED_STATUSES.includes(response.status)) {
      response = await request(fetchFn, link.href, 'GET');
    }
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
