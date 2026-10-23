import { describe, expect, it } from 'vitest';
import { resourceUriOf } from '../src/host/command-target.ts';

const fileUri = { scheme: 'file', fsPath: '/work/a.gs', toString: () => 'file:///work/a.gs' };

describe('resourceUriOf', () => {
  it('devolve o endereço do arquivo clicado no explorador ou no título do editor', () => {
    expect(resourceUriOf(fileUri)).toBe('file:///work/a.gs');
  });

  it.each([undefined, null, 'file:///work/a.gs', 42, {}, { scheme: 'file' }])('ignora argumento que não é endereço: %j', (argument) => {
    expect(resourceUriOf(argument)).toBeUndefined();
  });
});
