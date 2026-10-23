import { describe, expect, it } from 'vitest';
import { guardCommand, guardRefusalMessage } from '../src/commands/command-guards.ts';
import type { CliCommand, GuardResult } from '../src/commands/commands.types.ts';
import { createFakeHost } from './support/fake-host.ts';

const host = createFakeHost();
const document = (scheme: string, languageId: string) => host.makeDocument({ scheme, languageId });

const CASES: readonly (readonly [CliCommand, string, string | null, boolean, GuardResult])[] = [
  ['traduz', 'file', 'goiasscript', false, { allowed: true }],
  ['traduz', 'file', 'goiasscript', true, { allowed: true }],
  ['bota_pra_moer', 'file', 'goiasscript', true, { allowed: true }],
  ['bota_pra_moer', 'file', 'goiasscript', false, { allowed: false, reason: 'untrusted' }],
  ['traduz', 'untitled', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['traduz', 'git', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['bota_pra_moer', 'vscode-remote', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['bota_pra_moer', 'vscode-vfs', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['traduz', 'output', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['traduz', 'http', 'goiasscript', true, { allowed: false, reason: 'not-file' }],
  ['bota_pra_moer', 'untitled', 'goiasscript', false, { allowed: false, reason: 'not-file' }],
  ['traduz', 'file', 'javascript', true, { allowed: false, reason: 'not-goiasscript' }],
  ['bota_pra_moer', 'file', 'javascript', true, { allowed: false, reason: 'not-goiasscript' }],
  ['traduz', 'file', null, true, { allowed: false, reason: 'not-goiasscript' }],
];

describe('guardCommand', () => {
  it.each(CASES)('%s, esquema %s, linguagem %s, confiável %s', (command, scheme, languageId, trusted, expected) => {
    const target = languageId === null ? undefined : document(scheme, languageId);
    expect(guardCommand(command, target, trusted)).toEqual(expected);
  });
});

describe('guardCommand com caminhos fora do padrão', () => {
  it('recusa arquivo que a pasta associou à linguagem mas não termina em .gs', () => {
    const target = host.makeDocument({ fsPath: '/projeto/segredo.txt' });
    expect(guardCommand('traduz', target, false)).toEqual({ allowed: false, reason: 'not-goiasscript' });
  });

  it.each(['\\\\servidor\\pasta\\a.gs', '//servidor/pasta/a.gs'])('recusa caminho de rede %s', (fsPath) => {
    expect(guardCommand('traduz', host.makeDocument({ fsPath }), true)).toEqual({ allowed: false, reason: 'not-file' });
  });

  it('aceita a extensão .gs em maiúsculas', () => {
    expect(guardCommand('traduz', host.makeDocument({ fsPath: '/projeto/A.GS' }), true)).toEqual({ allowed: true });
  });
});

describe('guardRefusalMessage', () => {
  it('pede confiança quando o workspace não é confiável', () => {
    expect(guardRefusalMessage('untrusted', 'raiz')).toContain('confia');
  });

  it.each(['not-file', 'not-goiasscript', 'untrusted'] as const)('fala em goianês e em tom neutro para %s', (reason) => {
    expect(guardRefusalMessage(reason, 'raiz')).not.toBe(guardRefusalMessage(reason, 'neutro'));
  });
});
