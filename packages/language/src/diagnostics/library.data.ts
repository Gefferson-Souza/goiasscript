import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const LIBRARY_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0601', 'error', 'Membro com nome da biblioteca', t('Ô sô, "{name}" já é nome de trem da biblioteca ({description}). Pra esse campo, que tal "{suggestion}"?', '"{name}" é nome da biblioteca padrão ({description}). Para este campo, use outro nome, como "{suggestion}".'), 'uai o é { o_tanto: 3 }', { lesson: 'licao-08' }),
  d('GS0602', 'error', 'pergunta fora de contexto assíncrono', t('Ô sô, "pergunta" precisa de função "vai_na_frente" pra esperar a resposta.', '"pergunta" precisa estar no topo ou em função assíncrona ("vai_na_frente").'), 'faz_trem f() { faz_favor pergunta("a") }', { help: t('Troca por: vai_na_frente faz_trem f() { … }', 'Use: vai_na_frente faz_trem f() { … }'), lesson: 'licao-11' }),
  d('GS0603', 'error', 'Forma errada de membro da biblioteca', t('Ô sô, ".{name}" {expected}.', '".{name}" {expected}.'), 'uai l é [1]\nprosa(l.o_tanto())', { lesson: 'licao-06' }),
  d('GS0604', 'error', 'Número de argumentos', t('Ô sô, ".{name}" quer {arity} e veio {received}.', '".{name}" espera {arity}, mas recebeu {received}.'), 'uai l é [1]\nprosa(l.arruma(x => x))', { help: t('Jeito certo: {signature}', 'Forma correta: {signature}'), lesson: 'licao-06' }),
];
