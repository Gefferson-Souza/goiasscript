import { describe, expect, it } from 'vitest';
import { resolveReleaseTarget } from '../../../scripts/release-target.ts';

describe('resolveReleaseTarget', () => {
  it('manda o alpha para a dist-tag next', () => {
    expect(resolveReleaseTarget('v3.0.0-alpha.0', '3.0.0-alpha.0')).toEqual({ ok: true, version: '3.0.0-alpha.0', distTag: 'next' });
  });

  it.each([
    ['v3.0.0', '3.0.0'],
    ['v3.0.0-alpha.1', '3.0.0-alpha.0'],
    ['3.0.0-alpha.0', '3.0.0-alpha.0'],
    ['v2.0.0-alpha.0', '2.0.0-alpha.0'],
  ])('recusa a tag %s com o pacote em %s', (tag, version) => {
    expect(resolveReleaseTarget(tag, version)).toMatchObject({ ok: false });
  });

  it('explica a recusa em goianês', () => {
    const result = resolveReleaseTarget('v3.0.0', '3.0.0');
    expect(result.ok ? '' : result.reason).toContain('alpha');
  });
});
