import type { IntegrationScenario, LaunchInput } from './integration.types.ts';

const TRUST_ENABLED_KEY = 'security.workspace.trust.enabled';

// Sem a flag de confiança desligada o VS Code abre a pasta em Modo Restrito, que é o que o cenário não confiável precisa.
export function buildLaunchArgs(input: LaunchInput): readonly string[] {
  const trustFlag = input.scenario === 'trusted' ? ['--disable-workspace-trust'] : [];
  return [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--no-cached-data',
    '--disable-extensions',
    ...trustFlag,
    `--extensionDevelopmentPath=${input.extensionDir}`,
    `--extensionTestsPath=${input.suiteEntry}`,
    `--user-data-dir=${input.userDataDir}`,
    `--extensions-dir=${input.extensionsDir}`,
    input.workspaceDir,
  ];
}

export function buildUserSettings(scenario: IntegrationScenario): Readonly<Record<string, unknown>> {
  const common = { 'telemetry.telemetryLevel': 'off', 'update.mode': 'none', 'workbench.startupEditor': 'none' };
  if (scenario === 'trusted') return common;
  return { ...common, [TRUST_ENABLED_KEY]: true, 'security.workspace.trust.startupPrompt': 'never', 'security.workspace.trust.banner': 'never', 'security.workspace.trust.untrustedFiles': 'open' };
}
