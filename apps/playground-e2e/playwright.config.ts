import { defineConfig, devices } from '@playwright/test';
import {
  BUILD_AND_START,
  CI_RETRIES,
  MONOREPO_ROOT,
  SERVER_START_TIMEOUT_MS,
  TEST_PUBLIC_ENV,
  TEST_TIMEOUT_MS,
} from './playwright.constants.ts';
import { resolveEphemeralPort } from './tests/support/ephemeral-port.ts';

const port = resolveEphemeralPort();
const baseURL = `http://127.0.0.1:${String(port)}`;
const isCi = process.env['CI'] !== undefined;

// O playground sobe em produção (next build + next start) para o E2E ver os mesmos cabeçalhos de segurança do deploy.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: TEST_TIMEOUT_MS,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? CI_RETRIES : 0,
  reporter: isCi ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: BUILD_AND_START,
    url: baseURL,
    timeout: SERVER_START_TIMEOUT_MS,
    reuseExistingServer: false,
    cwd: MONOREPO_ROOT,
    env: { ...TEST_PUBLIC_ENV, PORT: String(port) },
  },
});
