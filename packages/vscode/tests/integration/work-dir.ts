import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { IntegrationScenario } from './integration.types.ts';

const SHORT_BASE_DIR = '/tmp';
const WINDOWS_PLATFORM = 'win32';
const SOCKET_FILE_NAME = '1.999-main.sock';
const SOCKET_PATH_LIMIT = 103;

export function pickBaseDir(platform: NodeJS.Platform = process.platform, shortBase: string = SHORT_BASE_DIR): string {
  return platform !== WINDOWS_PLATFORM && fs.existsSync(shortBase) ? shortBase : os.tmpdir();
}

export function workDirPrefix(scenario: IntegrationScenario): string {
  return `gs-${scenario.charAt(0)}-`;
}

export function assertSocketPathFits(userDataDir: string): void {
  const socketPath = path.join(userDataDir, SOCKET_FILE_NAME);
  if (socketPath.length > SOCKET_PATH_LIMIT) {
    throw new Error(`O caminho do socket do VS Code ficaria com ${String(socketPath.length)} caracteres (limite ${String(SOCKET_PATH_LIMIT)}): ${socketPath}`);
  }
}

export function createWorkDir(scenario: IntegrationScenario, baseDir: string = pickBaseDir()): string {
  return fs.mkdtempSync(path.join(baseDir, workDirPrefix(scenario)));
}
