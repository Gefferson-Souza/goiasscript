import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

// Sobe o playground em produção (next start) pra exercitar os headers de
// segurança (CSP etc.) do next.config. O build roda no webServer.
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Pixel 5 = viewport mobile sobre Chromium (WebKit não está instalado).
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm --filter playground build && pnpm --filter playground start',
    url: BASE,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    cwd: '../..',
    env: {
      // Next respeita PORT no start. URL fictícia inlined no build; os
      // specs interceptam **/engoiana.
      PORT: String(PORT),
      NEXT_PUBLIC_ENGOIANADOR_URL: 'https://api.mock.test',
    },
  },
});
