// Config de override (fora do repo): reaproveita o playwright.config.ts do repo e
// só troca o executável do Chromium pelo headless-shell que existe em cache
// (rev 1243), porque o @playwright/test@1.60.0 do repo pede a rev 1223.
import base from '<repo>/apps/playground-e2e/playwright.config';

const REPO = '<repo>';
const PROBES = '<scratchpad>/audit/probes-apps';
const HEADLESS_SHELL =
  '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

export default {
  ...base,
  testDir: `${REPO}/apps/playground-e2e/tests`,
  outputDir: `${PROBES}/e2e-override/test-results`,
  reporter: [['list'], ['json', { outputFile: `${PROBES}/logs/05b-e2e-override.json` }]],
  projects: (base.projects ?? []).map((p: any) => ({
    ...p,
    use: { ...p.use, launchOptions: { executablePath: HEADLESS_SHELL } },
  })),
  webServer: { ...(base.webServer as any), cwd: REPO },
};
