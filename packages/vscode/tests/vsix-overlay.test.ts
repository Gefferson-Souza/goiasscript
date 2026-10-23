import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractCommand, overlayVsixDist } from './integration/vsix-overlay.ts';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-vsix-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  tempDirs.splice(0).forEach((dir) => { fs.rmSync(dir, { recursive: true, force: true }); });
});

describe('extractCommand', () => {
  it('usa unzip no Linux, onde o tar não abre zip', () => {
    expect(extractCommand('linux', 'a.vsix', 'out')).toEqual({ command: 'unzip', args: ['-q', 'a.vsix', '-d', 'out'] });
  });

  it('usa o bsdtar do macOS', () => {
    expect(extractCommand('darwin', 'a.vsix', 'out')).toEqual({ command: 'tar', args: ['-xf', 'a.vsix', '-C', 'out'] });
  });

  it('usa o bsdtar do sistema no Windows, não o tar do Git Bash', () => {
    expect(extractCommand('win32', 'a.vsix', 'out', 'D:\\Win').command).toBe('D:\\Win\\System32\\tar.exe');
    expect(extractCommand('win32', 'a.vsix', 'out').command).toBe('C:\\Windows\\System32\\tar.exe');
  });
});

describe.skipIf(process.platform !== 'linux')('overlayVsixDist', () => {
  it('troca o dist da extensão pelo que veio no vsix', () => {
    const source = makeTempDir();
    fs.mkdirSync(path.join(source, 'extension/dist'), { recursive: true });
    fs.writeFileSync(path.join(source, 'extension/dist/extension.cjs'), 'vsix');
    const vsix = path.join(makeTempDir(), 'pacote.vsix');
    execFileSync('zip', ['-qr', vsix, 'extension'], { cwd: source });
    const extensionDir = makeTempDir();
    fs.mkdirSync(path.join(extensionDir, 'dist'));
    fs.writeFileSync(path.join(extensionDir, 'dist/stale.cjs'), 'local');

    overlayVsixDist(vsix, extensionDir);

    expect(fs.readFileSync(path.join(extensionDir, 'dist/extension.cjs'), 'utf8')).toBe('vsix');
    expect(fs.existsSync(path.join(extensionDir, 'dist/stale.cjs'))).toBe(false);
  });

  it('recusa um vsix sem a pasta dist da extensão', () => {
    const source = makeTempDir();
    fs.mkdirSync(path.join(source, 'extension'));
    fs.writeFileSync(path.join(source, 'extension/package.json'), '{}');
    const vsix = path.join(makeTempDir(), 'vazio.vsix');
    execFileSync('zip', ['-qr', vsix, 'extension'], { cwd: source });

    expect(() => { overlayVsixDist(vsix, makeTempDir()); }).toThrow(/dist/u);
  });
});
