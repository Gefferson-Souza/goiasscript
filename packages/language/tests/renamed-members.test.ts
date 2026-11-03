import { describe, expect, it } from 'vitest';
import { RENAMED_MEMBERS, STDLIB, lookupRenamedMember } from '../src/index.ts';

describe('membros renomeados', () => {
  it('todo nome novo existe de verdade na biblioteca', () => {
    const missing = RENAMED_MEMBERS.filter((member) => !STDLIB.some((entry) => entry.name === member.to));
    expect(missing).toEqual([]);
  });
  it('nenhum nome antigo continua existindo na biblioteca', () => {
    const alive = RENAMED_MEMBERS.filter((member) => STDLIB.some((entry) => entry.name === member.from));
    expect(alive).toEqual([]);
  });
  it('consulta devolve o nome novo ou nada', () => {
    expect(lookupRenamedMember('tamanho')).toBe('o_tanto');
    expect(lookupRenamedMember('reduzir')).toBe('amontoar');
    expect(lookupRenamedMember('se_der_pobrema')).toBe('se_der_ruim');
    expect(lookupRenamedMember('gritando')).toBeUndefined();
  });
});
