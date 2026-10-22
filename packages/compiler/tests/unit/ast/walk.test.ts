import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { parseText } from '../../support/parse.ts';

describe('ast: walk', () => {
  it('visita em pré-ordem e coleta os identificadores na ordem do texto', () => {
    const names: string[] = [];
    walk(parseText('uai a é b mais 1').program, (node) => {
      if (node.type === 'Identifier') names.push((node).name);
    });
    expect(names).toEqual(['a', 'b']);
  });
});
