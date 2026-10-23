import { describe, expect, it } from 'vitest';
import { resolveVscodeReleaseTarget } from '../../../scripts/release-target-vscode.ts';

describe('resolveVscodeReleaseTarget', () => {
  it('publica 0.3.N como pré-lançamento', () => {
    expect(resolveVscodeReleaseTarget('vscode-v0.3.0', '0.3.0')).toEqual({ ok: true, version: '0.3.0', preRelease: true });
  });

  it('publica 3.0.0 ou mais novo como estável', () => {
    expect(resolveVscodeReleaseTarget('vscode-v3.0.0', '3.0.0')).toEqual({ ok: true, version: '3.0.0', preRelease: false });
    expect(resolveVscodeReleaseTarget('vscode-v3.2.10', '3.2.10')).toMatchObject({ ok: true, preRelease: false });
  });

  it.each([
    ['v0.3.0', '0.3.0'],
    ['vscode-v0.3.1', '0.3.0'],
    ['vscode-v0.3.0-rc.1', '0.3.0'],
    ['vscode-v3.0.0-alpha.0', '3.0.0-alpha.0'],
    ['vscode-0.3.0', '0.3.0'],
    ['vscode-v0.3', '0.3'],
    ['', '0.3.0'],
  ])('recusa a tag "%s" com o manifesto em %s', (tag, manifestVersion) => {
    expect(resolveVscodeReleaseTarget(tag, manifestVersion)).toMatchObject({ ok: false });
  });

  it('explica a recusa em goianês', () => {
    const mismatch = resolveVscodeReleaseTarget('vscode-v0.3.1', '0.3.0');
    const suffix = resolveVscodeReleaseTarget('vscode-v3.0.0-alpha.0', '3.0.0-alpha.0');
    expect(mismatch.ok ? '' : mismatch.reason).toContain('0.3.0');
    expect(suffix.ok ? '' : suffix.reason).toContain('vscode-v');
  });
});
