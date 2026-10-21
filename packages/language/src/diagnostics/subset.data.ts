import { LIMITS } from '../limits.constants.ts';
import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

const NESTING_EXCESS = 100;

export const SUBSET_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0500', 'error', 'Construção do JavaScript fora da v3', t('Ô sô, isso do JavaScript ainda não existe em GoiásScript 3.', 'Esta construção do JavaScript ainda não existe em GoiásScript 3.'), 'debugger'),
  d('GS0501', 'error', 'Template literal', t('Ô sô, crase não rola. Junta os pedaços com "mais".', 'Template literals não existem em GoiásScript 3. Junte os textos com "mais".'), 'uai t é `oi`'),
  d('GS0502', 'error', 'Expressão regular', t('Ô sô, expressão regular ainda não existe por aqui.', 'Expressões regulares ainda não existem em GoiásScript 3.'), 'uai r é /ab+/g'),
  d('GS0503', 'error', 'Desestruturação', t('Ô sô, desestruturar não rola. Pega cada campo com ponto.', 'Desestruturação não existe em GoiásScript 3. Acesse cada campo com ".".'), 'uai [a, b] é [1, 2]'),
  d('GS0504', 'error', 'Spread e rest', t('Ô sô, o "..." não existe por aqui.', 'O operador "..." não existe em GoiásScript 3.'), 'prosa(...[1])'),
  d('GS0505', 'error', 'switch', t('Ô sô, "switch" não existe. Usa "se_ocê_quiser" e "se_num_for".', '"switch" não existe em GoiásScript 3. Use "se_ocê_quiser" e "se_num_for".'), 'switch (1) { }'),
  d('GS0506', 'error', 'do…while', t('Ô sô, "do…while" não existe. Usa "enquanto_tiver".', '"do…while" não existe em GoiásScript 3. Use "enquanto_tiver".'), 'do { } while (certeza)'),
  d('GS0507', 'error', 'Rótulo', t('Ô sô, rótulo não existe por aqui.', 'Rótulos não existem em GoiásScript 3.'), 'uai f é x => { a: x }', { help: t('Pra devolver uma coisa direto, usa parênteses: x => ({ a: x }).', 'Para devolver uma coisa direto, use parênteses: x => ({ a: x }).') }),
  d('GS0508', 'error', 'Getter e setter', t('Ô sô, "get" e "set" não existem. Faz um método normal.', 'Getters e setters não existem em GoiásScript 3. Use um método.'), 'arruma_trem A {\n  get x() { faz_favor 1 }\n}'),
  d('GS0509', 'error', 'Campo no corpo da classe', t('Ô sô, campo no corpo da classe não existe. Declara no "aprepara_trem" com "ocê.campo é …".', 'Campos no corpo da classe não existem. Declare no construtor com "ocê.campo é …".'), 'arruma_trem A {\n  x é 1\n}'),
  d('GS0510', 'error', 'Campo privado', t('Ô sô, campo privado com "#" não existe.', 'Campos privados com "#" não existem em GoiásScript 3.'), 'arruma_trem A {\n  #x\n}'),
  d('GS0511', 'error', 'Generator', t('Ô sô, gerador ("function*", "yield") não existe.', 'Geradores não existem em GoiásScript 3.'), 'faz_trem* f() { }'),
  d('GS0512', 'error', 'typeof', t('Ô sô, "typeof" não existe por aqui.', '"typeof" não existe em GoiásScript 3.'), 'prosa(typeof 1)'),
  d('GS0513', 'error', 'delete', t('Ô sô, "delete" não existe por aqui.', '"delete" não existe em GoiásScript 3.'), 'uai o é { a: 1 }\ndelete o.a'),
  d('GS0514', 'error', 'void', t('Ô sô, "void" não existe por aqui.', '"void" não existe em GoiásScript 3.'), 'prosa(void 0)'),
  d('GS0515', 'error', 'Módulos', t('Ô sô, módulo ("import", "export") não existe na v3. É um arquivo só.', 'Módulos não existem em GoiásScript 3. Use um arquivo só.'), 'import x from "y"'),
  d('GS0516', 'error', 'Tipo na declaração', t('Ô sô, tipo na declaração não existe. Tira o ": tipo".', 'Anotações de tipo não existem em GoiásScript 3. Remova o ": tipo".'), 'uai x: texto é "a"'),
  d('GS0517', 'error', 'Formato numérico fora da v3', t('Ô sô, número em hexadecimal, com "_" ou BigInt não existe. Usa decimal.', 'Números hexadecimais, com "_" ou BigInt não existem. Use decimal.'), 'uai n é 0xff'),
  d('GS0518', 'error', 'Função como valor sem seta', t('Ô sô, função como valor é só com seta. Usa "x => …".', 'Função como valor só existe com seta ("x => …").'), 'uai f é faz_trem(x) { faz_favor x }', { help: t('Ou declara com nome: faz_trem soma(a, b) { … }.', 'Ou declare com nome: faz_trem soma(a, b) { … }.') }),
  d('GS0519', 'error', 'Chave abreviada em coisa', t('Ô sô, na coisa escreve "chave: valor"; "{ x }" sozinho não rola.', 'Em coisas, escreva "chave: valor"; a forma abreviada não existe.'), 'uai x é 1\nuai o é { x }'),
  d('GS0520', 'error', 'Método abreviado em coisa', t('Ô sô, método em coisa não rola. Usa "chave: x => …".', 'Métodos abreviados em coisas não existem. Use "chave: x => …".'), 'uai o é { f() { } }'),
  d('GS0521', 'error', 'Chave computada', t('Ô sô, chave entre colchetes na coisa não existe.', 'Chaves computadas não existem em GoiásScript 3.'), 'uai k é "a"\nuai o é { [k]: 1 }'),
  d('GS0522', 'error', 'Trem muito aninhado', t('Ô sô, esse trem tá aninhado demais (passou de {limit} níveis). Quebra em pedaços menores.', 'Aninhamento acima do limite de {limit} níveis. Divida o código.'), '('.repeat(LIMITS.maxNestingDepth + NESTING_EXCESS)),
  d('GS0523', 'error', 'Operador fora da v3', t('Ô sô, "{name}" não existe em GoiásScript 3.[[ Usa "{suggestion}".]]', 'O operador "{name}" não existe em GoiásScript 3.[[ Use "{suggestion}".]]'), 'uai x é 1 ?? 2'),
];
