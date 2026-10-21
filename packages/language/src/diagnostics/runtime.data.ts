import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const RUNTIME_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0701', 'error', 'Laço passou do limite', t('Ô sô, esse laço rodou demais (linha {line}). Será que ele nunca termina?', 'O laço excedeu o limite de iterações (linha {line}).'), 'enquanto_tiver (certeza) {\n}'),
  d('GS0702', 'error', 'Acabou a entrada', t('Acabou a entrada, sô: o programa pediu uma resposta e não veio mais nada.', 'A entrada terminou: o programa pediu uma resposta e não há mais dados.'), 'prosa(pergunta("a"))'),
  d('GS0703', 'error', 'Programa esperando para sempre', t('O programa ficou esperando uma resposta que nunca veio, sô.', 'O programa ficou aguardando indefinidamente uma resposta que nunca chegou.'), 'espera_um_cadim faz_um Promessa((resolve_aí) => { })'),
  d('GS0710', 'error', 'Erro de tipo', t('Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.', 'Erro de tipo: um valor foi usado de forma inválida.'), 'uai o é { a: 1 }\nprosa(faz_um o.a())'),
  d('GS0711', 'error', 'Erro de referência', t('Ô sô, o programa usou um nome que ainda não existe.', 'Erro de referência: nome usado antes de existir.'), ''),
  d('GS0712', 'error', 'Erro de faixa', t('Ô sô, um número ficou fora do que o trem aceita.', 'Erro de faixa: valor fora do intervalo permitido.'), ''),
  d('GS0713', 'error', 'Erro de sintaxe em execução', t('Ô sô, o motor não entendeu um trecho do código.', 'Erro de sintaxe detectado em execução.'), ''),
  d('GS0714', 'error', 'Erro desconhecido', t('Ô sô, deu um erro que a gente não conhece.', 'Ocorreu um erro desconhecido.'), ''),
];
