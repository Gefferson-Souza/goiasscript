import { expect, test } from '@playwright/test';
import { PAGE_CSP_DIRECTIVES, SANDBOX_CSP } from '../../playground/config/security-headers.constants.ts';

const RUNNER_PATH = '/sandbox/runner.js';

test.describe('cabeçalhos de segurança', () => {
  test('a página serve a CSP própria, sem unsafe-eval nem a política do runner', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    const csp = headers['content-security-policy'] ?? '';

    expect(csp.split('; ')).toEqual([...PAGE_CSP_DIRECTIVES, expect.stringMatching(/^connect-src 'self'/u)]);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('o runner serve só a CSP restrita e não herda a da página', async ({ request }) => {
    const response = await request.get(RUNNER_PATH);
    const headers = response.headers();

    expect(response.ok()).toBe(true);
    expect(headers['content-security-policy']).toBe(SANDBOX_CSP);
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});
