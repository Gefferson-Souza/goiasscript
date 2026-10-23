import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ExtractCommand } from './integration.types.ts';

const LINUX_PLATFORM = 'linux';
const WINDOWS_PLATFORM = 'win32';
const DEFAULT_SYSTEM_ROOT = 'C:\\Windows';
const DIST_DIR_NAME = 'dist';
const PACKED_DIST_DIR = path.join('extension', DIST_DIR_NAME);

// O tar GNU não abre zip, e no Windows o Git Bash põe o dele antes do bsdtar do sistema no PATH.
export function extractCommand(platform: NodeJS.Platform, vsix: string, destination: string, systemRoot = DEFAULT_SYSTEM_ROOT): ExtractCommand {
  if (platform === LINUX_PLATFORM) return { command: 'unzip', args: ['-q', vsix, '-d', destination] };
  const command = platform === WINDOWS_PLATFORM ? path.win32.join(systemRoot, 'System32', 'tar.exe') : 'tar';
  return { command, args: ['-xf', vsix, '-C', destination] };
}

export function overlayVsixDist(vsix: string, extensionDir: string): void {
  const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-vsix-'));
  try {
    const { command, args } = extractCommand(process.platform, vsix, extractDir, process.env['SystemRoot']);
    execFileSync(command, args, { stdio: 'inherit' });
    const packedDist = path.join(extractDir, PACKED_DIST_DIR);
    if (!fs.existsSync(packedDist)) throw new Error(`O vsix ${vsix} não traz a pasta ${PACKED_DIST_DIR}.`);
    const targetDist = path.join(extensionDir, DIST_DIR_NAME);
    fs.rmSync(targetDist, { recursive: true, force: true });
    fs.cpSync(packedDist, targetDist, { recursive: true });
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
}
