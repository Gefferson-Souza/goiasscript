import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const SYNTAX_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0201', 'error', 'Fim da entrada inesperado', t('Ô sô, o código acabou antes da hora. Falta fechar algum trem?', 'O código terminou inesperadamente. Falta fechar algo?'), 'se_ocê_quiser (x) {'),
  d('GS0202', 'error', 'Trecho inesperado', t('Ô sô, não entendi esse trecho: "{found}" não cabe aqui.', 'Trecho inesperado: "{found}".'), 'uai x é 1 2', { help: t('Confere se terminou a instrução direito. Pra chamar método de número literal, usa parênteses: (5).com_casas(2).', 'Verifique o fim da instrução. Para chamar método de número literal, use parênteses: (5).com_casas(2).') }),
  d('GS0203', 'error', 'Linha começa com operador', t('Ô sô, a linha não pode começar com "{found}". Termina a conta na linha de cima ou usa parênteses.', 'A linha não pode começar com o operador "{found}". Termine a conta na linha anterior ou use parênteses.'), 'uai a é 1\nmais 2'),
  d('GS0204', 'error', 'Quebra antes da seta', t('Ô sô, não pode quebrar a linha entre os parâmetros e o "=>".', 'Não quebre a linha entre os parâmetros e "=>".'), 'uai f é x\n=> x'),
  d('GS0205', 'error', 'Continuação sem início', t('Ô sô, esse "{found}" não tem o que continuar.', 'O "{found}" não continua nenhuma instrução anterior.'), 'se_não {\n}', { help: t('Bota o "{found}" na linha do "}" ou na seguinte.', 'Coloque o "{found}" na linha do "}" ou na seguinte.') }),
  d('GS0206', 'error', 'vixe fora de lugar', t('Ô sô, "vixe" é instrução e leva exatamente uma coisa.', '"vixe" é uma instrução e recebe exatamente um valor.'), 'uai f é x => vixe("a")', { help: t('"vixe" é instrução; usa bloco: x => { vixe("…") }', 'Use bloco: x => { vixe("…") }'), lesson: 'licao-10' }),
  d('GS0207', 'error', 'Corpo sem chaves', t('Ô sô, o corpo precisa das chaves.', 'O corpo precisa estar entre chaves.'), 'se_ocê_quiser (x) prosa(x)', { help: t('Bota as chaves: se_ocê_quiser (x) { prosa(x) }', 'Coloque as chaves: se_ocê_quiser (x) { prosa(x) }'), lesson: 'licao-04' }),
  d('GS0208', 'error', 'Vírgula decimal', t('Ô sô, número com vírgula não rola. Aqui o decimal é com ponto: {suggestion}.', 'Decimais usam ponto, não vírgula. Escreva {suggestion}.'), 'uai preço é 10,50', { lesson: 'licao-02' }),
  d('GS0209', 'error', 'Alvo de atribuição inválido', t('Ô sô, não dá pra guardar valor aí. O "é" quer um nome ou um campo do lado esquerdo.', 'Alvo de atribuição inválido. Use um nome ou um membro.'), '1 é x'),
];
