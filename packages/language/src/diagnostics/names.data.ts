import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const NAMES_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0301', 'error', 'Nome não declarado', t('Esse trem "{name}" não existe por aqui.[[ Cê quis dizer "{suggestion}"?]]', 'O nome "{name}" não foi declarado.[[ Você quis dizer "{suggestion}"?]]'), 'prosa(nomi)', { lesson: 'licao-02' }),
  d('GS0302', 'error', 'Reatribuição de uai', t('Ô sô, "{name}" foi guardado com "uai" e não muda. Se muda, declara com "trem".', '"{name}" foi declarado com "uai" e não pode ser reatribuído. Use "trem" se o valor muda.'), 'uai x é 1\nx é 2', { lesson: 'licao-02' }),
  d('GS0303', 'error', 'Palavra da linguagem usada como nome', t('"{name}" é palavra da linguagem; que tal "{suggestion}"?', '"{name}" é palavra reservada da linguagem; use outro nome, como "{suggestion}".'), 'uai mais é 1'),
  d('GS0304', 'error', 'Nome declarado duas vezes', t('Ô sô, "{name}" já foi declarado aqui.', '"{name}" já foi declarado neste escopo.'), 'uai x é 1\nuai x é 2', { lesson: 'licao-02' }),
  d('GS0305', 'error', 'Membro não declarado', t('Esse trem ".{name}" não existe por aqui.[[ Cê quis dizer ".{suggestion}"?]]', 'O membro ".{name}" não foi declarado.[[ Você quis dizer ".{suggestion}"?]]'), 'uai o é { nome: 1 }\nprosa(o.nmoe)', { lesson: 'licao-08' }),
  d('GS0306', 'error', 'Palavra de versão anterior', t('"{word}" era de uma versão antiga.[[ Agora a gente fala "{replacement}".]][[ Esse trem {gone}.]]', '"{word}" era de uma versão anterior.[[ Agora use "{replacement}".]][[ Este recurso {gone}.]]'), 'presta_serviço soma(a, b) { faz_favor a mais b }', { help: t('Dá uma olhada na página "o que mudou" pra ver a forma nova.', 'Consulte a página "o que mudou" para a forma nova.'), lesson: 'o-que-mudou' }),
  d('GS0307', 'error', 'uai sem valor inicial', t('Ô sô, "uai" precisa de valor na hora de nascer.', '"uai" exige valor inicial.'), 'uai x', { help: t('Dá um valor: uai x é 0. Se o valor vem depois, usa "trem".', 'Atribua um valor: uai x é 0. Se o valor vem depois, use "trem".'), lesson: 'licao-02' }),
  d('GS0308', 'error', 'Fora de laço', t('Ô sô, "{name}" só serve dentro de um laço.', '"{name}" só pode ser usado dentro de laço.'), 'para_com_isso', { lesson: 'licao-05' }),
  d('GS0309', 'error', 'faz_favor fora de função', t('Ô sô, "faz_favor" só serve dentro de função.', '"faz_favor" só pode ser usado dentro de função.'), 'faz_favor 1', { lesson: 'licao-07' }),
  d('GS0310', 'error', 'Dois construtores', t('Ô sô, a classe só pode ter um "aprepara_trem".', 'A classe só pode ter um "aprepara_trem".'), 'arruma_trem A {\n  aprepara_trem() { }\n  aprepara_trem() { }\n}', { lesson: 'licao-09' }),
  d('GS0311', 'error', 'Uso inválido de a_raiz', t('Ô sô, "a_raiz" não cabe aí: vale no "aprepara_trem" (antes de usar "ocê") ou em método de classe que herda.', 'Uso inválido de "a_raiz": use no construtor (antes de "ocê") ou em método de classe que herda.'), 'uai x é a_raiz(1)', { lesson: 'licao-09' }),
  d('GS0312', 'error', 'espera_um_cadim fora de função assíncrona', t('Ô sô, "espera_um_cadim" só funciona em função "vai_na_frente".', '"espera_um_cadim" só pode ser usado em função assíncrona ("vai_na_frente").'), 'faz_trem f() { espera_um_cadim cochila(1) }', { lesson: 'licao-11' }),
];
