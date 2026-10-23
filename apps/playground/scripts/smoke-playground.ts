import { SANDBOX_CSP } from '../config/security-headers.constants.ts';
import {
  DONATION_ROUTE,
  HOME_FRAME_GUARD,
  JAVASCRIPT_CONTENT_TYPE,
  MAX_REDIRECTS,
  MISSING_ROUTE,
  NOT_FOUND_MARKER,
  REDIRECT_STATUS_MAX,
  REDIRECT_STATUS_MIN,
  RUNNER_ROUTE,
  STATUS_NOT_FOUND,
  STATUS_OK,
} from './smoke-playground.constants.ts';
import type { SmokeCheck, SmokeFailure } from './smoke-playground.types.ts';

const CSP_HEADER = 'Content-Security-Policy';

const CHECKS: readonly SmokeCheck[] = [
  {
    path: '/',
    expectedStatus: STATUS_OK,
    inspect: (response) =>
      (response.headers.get(CSP_HEADER) ?? '').includes(HOME_FRAME_GUARD)
        ? []
        : [`cabeçalho ${CSP_HEADER} sem ${HOME_FRAME_GUARD}`],
  },
  {
    path: RUNNER_ROUTE,
    expectedStatus: STATUS_OK,
    inspect: (response) => [
      ...(JAVASCRIPT_CONTENT_TYPE.test(response.headers.get('content-type') ?? '') ? [] : ['content-type não é JavaScript']),
      ...(response.headers.get(CSP_HEADER) === SANDBOX_CSP
        ? []
        : [`cabeçalho ${CSP_HEADER} diferente da política isolada do runner`]),
    ],
  },
  {
    path: MISSING_ROUTE,
    expectedStatus: STATUS_NOT_FOUND,
    inspect: (_response, body) => (body.includes(NOT_FOUND_MARKER) ? [] : ['404 sem o texto em goianês']),
  },
  { path: DONATION_ROUTE, expectedStatus: STATUS_OK, inspect: () => [] },
];

function isRedirect(status: number): boolean {
  return status >= REDIRECT_STATUS_MIN && status <= REDIRECT_STATUS_MAX;
}

async function fetchFollowingSameHost(start: URL, fetchFn: typeof fetch): Promise<Response> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchFn(current, { redirect: 'manual' });
    const location = response.headers.get('location');
    if (!isRedirect(response.status) || location === null) return response;
    const next = new URL(location, current);
    if (next.host !== start.host) throw new Error(`redirecionou para outro host (${next.host})`);
    current = next;
  }
  throw new Error('redirecionamentos demais');
}

async function runCheck(baseUrl: URL, check: SmokeCheck, fetchFn: typeof fetch): Promise<readonly SmokeFailure[]> {
  try {
    const response = await fetchFollowingSameHost(new URL(check.path, baseUrl), fetchFn);
    const messages =
      response.status === check.expectedStatus
        ? check.inspect(response, await response.text())
        : [`esperava status ${String(check.expectedStatus)} e veio ${String(response.status)}`];
    return messages.map((message) => ({ path: check.path, message }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [{ path: check.path, message: `requisição falhou: ${reason}` }];
  }
}

export async function runSmoke(baseUrl: string, fetchFn: typeof fetch): Promise<readonly SmokeFailure[]> {
  const base = new URL(baseUrl);
  const results = await Promise.all(CHECKS.map((check) => runCheck(base, check, fetchFn)));
  return results.flat();
}
