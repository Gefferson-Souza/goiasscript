import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, instanceMethod, staticMember } from './stdlib-builders.ts';

export const DATE_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('Data', 'Date', ARITY.any, 'proposal'),
  staticMember('Data', 'agorinha', 'Date.now', 'method', ARITY.none, 'proposal'),
  instanceMethod('ano', 'date', 'getFullYear', ARITY.none, 'proposal', { alternatives: ['ano_do_evento'] }),
  instanceMethod('dia', 'date', 'getDate', ARITY.none, 'proposal', { alternatives: ['dia_do_evento'] }),
  instanceMethod('hora', 'date', 'getHours', ARITY.none, 'proposal', { alternatives: ['horario'] }),
  instanceMethod('minuto', 'date', 'getMinutes', ARITY.none, 'proposal', { alternatives: ['minutos'] }),
  instanceMethod('segundo', 'date', 'getSeconds', ARITY.none, 'proposal', { alternatives: ['segundos'] }),
  instanceMethod('mês', 'date', 'getMonth', ARITY.none, 'proposal', { kind: 'macro', semantics: 'didactic', alternatives: ['mes_do_evento'] }),
];
