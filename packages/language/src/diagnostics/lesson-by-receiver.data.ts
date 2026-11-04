import type { StdlibReceiver } from '../stdlib/stdlib.types.ts';

// Lição do GS0603/GS0604 pelo receptor do membro; ausente quando a cartilha não ensina esse receptor (decisão do dono, 2026-11-03).
export const LESSON_BY_RECEIVER: Readonly<Record<StdlibReceiver, string | undefined>> = {
  list: 'licao-06',
  textOrList: 'licao-06',
  text: 'licao-03',
  object: 'licao-08',
  namespace: undefined,
  number: undefined,
  date: undefined,
  promise: undefined,
  error: undefined,
  global: undefined,
};

// `namespace` serve a Conta e a Coisa; a chave é o prefixo do nome do membro. Conta fica fora: sem lição.
export const LESSON_BY_NAMESPACE: ReadonlyMap<string, string> = new Map([['Coisa', 'licao-08']]);
