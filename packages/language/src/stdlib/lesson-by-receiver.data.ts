import type { StdlibReceiver } from './stdlib.types.ts';

// Lição do GS0603/GS0604 pelo receptor do membro; ausente quando a cartilha não ensina esse receptor (decisão do dono, 2026-11-03).
export const LESSON_BY_RECEIVER: Readonly<Record<StdlibReceiver, string | undefined>> = {
  list: 'licao-06',
  textOrList: 'licao-06',
  text: 'licao-03',
  object: undefined,
  namespace: undefined,
  number: undefined,
  date: undefined,
  promise: undefined,
  error: undefined,
  global: undefined,
};

// A chave é o prefixo do nome do membro de `namespace`; prefixo fora daqui (Conta, Data, Promessa) fica sem lição.
export const LESSON_BY_NAMESPACE: ReadonlyMap<string, string> = new Map([['Coisa', 'licao-08']]);
