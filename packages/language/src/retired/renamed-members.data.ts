import type { RenamedMember } from './renamed-members.types.ts';

// Métodos da versão anterior que hoje têm outro nome; vale só o que existia de verdade na 1.5 e na 2.
export const RENAMED_MEMBERS: readonly RenamedMember[] = [
  { from: 'tamanho', to: 'o_tanto' },
  { from: 'ordenar', to: 'arruma' },
  { from: 'arranca_o_rabo', to: 'ranca_o_rabo' },
];
