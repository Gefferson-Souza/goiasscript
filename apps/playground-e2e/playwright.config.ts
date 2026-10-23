import { defineConfig, devices } from '@playwright/test';
import {
  BASE_PUBLIC_ENV,
  BUILD_AND_START,
  CHROMIUM_ONLY_SPECS,
  CI_RETRIES,
  CONFIGURED_DIST_DIR,
  CONFIGURED_PUBLIC_ENV,
  MONOREPO_ROOT,
  SERVER_START_TIMEOUT_MS,
  TEST_TIMEOUT_MS,
} from './playwright.constants.ts';
import { configuredServerOrigin, defaultServerOrigin } from './tests/support/servers.ts';

const baseURL = defaultServerOrigin();
const configuredOrigin = configuredServerOrigin();
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
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: [...CHROMIUM_ONLY_SPECS] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: [...CHROMIUM_ONLY_SPECS] },
  ],
  // O Playwright sobe um webServer por vez e só segue quando a URL responde; o build do segundo não corre com o do primeiro.
  webServer: [
    {
      command: BUILD_AND_START,
      url: baseURL,
      timeout: SERVER_START_TIMEOUT_MS,
      reuseExistingServer: false,
      cwd: MONOREPO_ROOT,
      env: { ...BASE_PUBLIC_ENV, PORT: new URL(baseURL).port },
    },
    {
      command: BUILD_AND_START,
      url: configuredOrigin,
      timeout: SERVER_START_TIMEOUT_MS,
      reuseExistingServer: false,
      cwd: MONOREPO_ROOT,
      env: { ...CONFIGURED_PUBLIC_ENV, NEXT_DIST_DIR: CONFIGURED_DIST_DIR, PORT: new URL(configuredOrigin).port },
    },
  ],
});
