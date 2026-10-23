import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSocketPathFits, createWorkDir, pickBaseDir, workDirPrefix } from './integration/work-dir.ts';

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('diretório de trabalho dos testes no VS Code', () => {
  it('usa um prefixo curto por cenário', () => {
    expect(workDirPrefix('trusted')).toBe('gs-t-');
    expect(workDirPrefix('untrusted')).toBe('gs-u-');
  });

  it('prefere a base curta fora do Windows e cai no tmpdir do sistema no Windows', () => {
    const shortBase = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-base-'));
    created.push(shortBase);
    expect(pickBaseDir('darwin', shortBase)).toBe(shortBase);
    expect(pickBaseDir('win32', shortBase)).toBe(os.tmpdir());
    expect(pickBaseDir('linux', '/nao/existe')).toBe(os.tmpdir());
  });

  it('cria o diretório sob a base informada', () => {
    const dir = createWorkDir('untrusted', pickBaseDir());
    created.push(dir);
    expect(fs.statSync(dir).isDirectory()).toBe(true);
    expect(path.basename(dir)).toMatch(/^gs-u-/);
  });

  it('mantém o socket abaixo do limite com a base curta', () => {
    const dir = createWorkDir('trusted', pickBaseDir('linux'));
    created.push(dir);
    expect(() => {
      assertSocketPathFits(path.join(dir, 'user-data'));
    }).not.toThrow();
  });

  it('acusa com mensagem clara quando o caminho do socket passa do limite', () => {
    expect(() => {
      assertSocketPathFits(`/var/folders/${'x'.repeat(100)}/user-data`);
    }).toThrow(/limite 103/);
  });
});
