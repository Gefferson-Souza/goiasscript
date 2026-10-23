import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import { bundleSuite } from './bundle-suite.ts';
import { SCENARIO_ENV } from './integration.constants.ts';
import type { IntegrationOptions, IntegrationScenario } from './integration.types.ts';
import { buildLaunchArgs, buildUserSettings } from './launch-config.ts';

const EXTENSION_DIR = path.join(import.meta.dirname, '../..');
const CACHE_DIR_NAME = '.vscode-test';
const DEFAULT_VERSION = 'stable';
const VERSION_FLAG = '--vscode-version';
const VERSION_ENV = 'VSCODE_VERSION';
const SCENARIOS: readonly IntegrationScenario[] = ['trusted', 'untrusted'];
const REQUIRED_BUILD_FILES = ['dist/extension.cjs', 'dist/cli/goiasscript.mjs'];
const ELECTRON_RUN_AS_NODE = 'ELECTRON_RUN_AS_NODE';

function assertBuilt(extensionDir: string): void {
  const missing = REQUIRED_BUILD_FILES.filter((file) => !fs.existsSync(path.join(extensionDir, file)));
  if (missing.length > 0) throw new Error(`Faltou empacotar a extensão (${missing.join(', ')}). Rode "corepack pnpm build:vscode" antes.`);
}

function launch(executable: string, args: readonly string[], scenario: IntegrationScenario): Promise<void> {
  const inheritedEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== ELECTRON_RUN_AS_NODE));
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], { env: { ...inheritedEnv, [SCENARIO_ENV]: scenario }, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`O VS Code encerrou o cenário ${scenario} com ${String(code ?? signal)}.`));
    });
  });
}

async function runScenario(executable: string, suiteEntry: string, extensionDir: string, scenario: IntegrationScenario): Promise<void> {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `gs-vscode-${scenario}-`));
  try {
    const userDataDir = path.join(workDir, 'user-data');
    const workspaceDir = path.join(workDir, 'workspace');
    fs.mkdirSync(path.join(userDataDir, 'User'), { recursive: true });
    fs.mkdirSync(workspaceDir);
    fs.writeFileSync(path.join(userDataDir, 'User', 'settings.json'), JSON.stringify(buildUserSettings(scenario)));
    const args = buildLaunchArgs({ scenario, extensionDir, suiteEntry, userDataDir, extensionsDir: path.join(workDir, 'extensions'), workspaceDir });
    await launch(executable, args, scenario);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export async function runIntegration(options: IntegrationOptions): Promise<void> {
  const extensionDir = options.extensionDir ?? EXTENSION_DIR;
  assertBuilt(extensionDir);
  const suiteEntry = await bundleSuite(extensionDir);
  const executable = await downloadAndUnzipVSCode({ version: options.vscodeVersion, cachePath: path.join(extensionDir, CACHE_DIR_NAME) });
  for (const scenario of SCENARIOS) {
    await runScenario(executable, suiteEntry, extensionDir, scenario);
  }
}

function versionFromArguments(argv: readonly string[]): string {
  const flagIndex = argv.indexOf(VERSION_FLAG);
  return (flagIndex >= 0 ? argv[flagIndex + 1] : process.env[VERSION_ENV]) ?? DEFAULT_VERSION;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runIntegration({ vscodeVersion: versionFromArguments(process.argv) });
  } catch (error) {
    process.stderr.write(`Ô rapaz! Os testes dentro do VS Code falharam: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
