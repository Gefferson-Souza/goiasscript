'use strict';
const L = (...lines) => lines.join('\n');
const lineCount = s => s.split('\n').length;

module.exports = [
  // ---------- operadores e números ----------
  { id: 'O01', grupo: 'operador', titulo: 'operador colado `x mais-1`', gs: 'uai x é 5; prosa(x mais-1);', esperado: '4', classe: 'controle' },
  { id: 'O02', grupo: 'operador', titulo: 'operador com parêntese `x mais(1)` e `vezes(2)`', gs: 'uai x é 5; prosa(x mais(1) vezes(2));', esperado: '7', classe: 'controle', nota: 'precedência JS: 5 + (1*2)' },
  { id: 'O03', grupo: 'operador', titulo: 'decimais e ponto flutuante', gs: 'prosa(0.1 mais 0.2, 3.14 vezes 2, 10 dividido 4, 7 sobrou 3);', esperado: '0.30000000000000004 6.28 2.5 1', classe: 'controle' },
  { id: 'O04', grupo: 'operador', titulo: 'literal numérico com expoente e ponto inicial', gs: 'prosa(1e3 mais .5, 2 ** 3);', esperado: '1000.5 8', classe: 'controle' },
  { id: 'O05', grupo: 'operador', titulo: 'operadores de comparação e lógicos', gs: 'prosa(3 maior_que 2 e_mais 1 menor_que 2, 1 diferente 1 ou_então certeza, 2 pelo_menos 2, 2 no_máximo 1);', esperado: 'true true true false', classe: 'controle' },
  { id: 'O06', grupo: 'operador', titulo: 'sem igualdade frouxa (==) nem incremento/atribuição composta em português', gs: L('trem n é 0;', 'n++;', 'n += 2;', 'prosa(n, 1 == "1");'), esperado: '3 true', classe: 'controle', nota: 'JS puro passa; não existem equivalentes goianos para ++, +=, ==, typeof, switch, let, import' },
  { id: 'O07', grupo: 'operador', titulo: 'README:131 `vai_indo (uai i é 0; i menor_que 5; i mais 1)` (laço da documentação)', gs: L('vai_indo (uai i é 0; i menor_que 5; i mais 1) {', '  prosa("Iteração", i)', '}'), runOpts: { timeoutMs: 300, maxLines: 5 }, check: r => ({ ok: r.transpiled && r.run.ok && r.run.stdout.split('\n').length === 5 && !r.run.stdout.includes('Iteração 0\nIteração 0'), detalhe: `exec=${r.run.ok ? 'ok' : r.run.error} | linhas capturadas=${r.run.stdout.split('\n').length} (+${r.run.dropped} descartadas)` }), sev: 'HIGH', classe: 'doc-incorreta', nota: 'erro da DOCUMENTAÇÃO, não do transpilador: `i mais 1` é `i + 1` e não incrementa (laço infinito em qualquer linguagem) e `uai` no cabeçalho gera `const`, o que impede até a correção `i é i mais 1`' },

  // ---------- o operador `é` ----------
  { id: 'E01', grupo: 'operador-é', titulo: 'baseline `uai x é 5`', gs: 'uai x é 5; prosa(x);', esperado: '5', classe: 'controle' },
  { id: 'E02', grupo: 'operador-é', titulo: '`é` colado em colchete: `uai x é[1,2]`', gs: 'uai x é[1,2]; prosa(x[0]);', esperado: '1', sev: 'LOW', classe: 'limite-de-design', nota: 'exige espaço dos dois lados' },
  { id: 'E03', grupo: 'operador-é', titulo: '`é` colado em parêntese/negativo: `x é(1)`, `y é-1`', gs: L('trem x é(1);', 'trem y é-1;', 'prosa(x, y);'), esperado: '1 -1', sev: 'LOW', classe: 'limite-de-design' },
  { id: 'E04', grupo: 'operador-é', titulo: '`uai total é` com o valor na linha seguinte (quebra estilo Prettier)', gs: L('uai total é', '  5;', 'prosa(total);'), esperado: '5', sev: 'MEDIUM', classe: 'defeito', nota: 'a heurística por linha exige " é " com espaço depois; "uai total é" no fim da linha é rejeitado como declaração incompleta' },
  { id: 'E04b', grupo: 'operador-é', titulo: 'atribuição com `é` no fim da linha preserva a contagem de linhas?', gs: L('trem total;', 'total é', '  5;', 'prosa(total);'), check: r => ({ ok: r.transpiled && r.run.ok && r.run.stdout === '5' && lineCount(r.user) === 4, detalhe: `stdout=${r.run && r.run.stdout} | linhas da saída=${r.user && lineCount(r.user)} (entrada tem 4)` }), sev: 'MEDIUM', classe: 'defeito', nota: '\\s+é\\s+ engole a quebra de linha: a numeração do .gs deixa de bater com a do JS' },
  { id: 'E05', grupo: 'operador-é', titulo: '`é` no começo da linha seguinte (continuação)', gs: L('uai total', '  é 5;', 'prosa(total);'), esperado: '5', sev: 'LOW', classe: 'defeito', nota: 'a validação de `uai` é por linha e dá falso-positivo "Declaração incompleta"' },
  { id: 'E07', grupo: 'operador-é', titulo: 'atribuição encadeada `a é b é 3`', gs: L('trem a;', 'trem b;', 'a é b é 3;', 'prosa(a, b);'), esperado: '3 3', classe: 'controle' },
  { id: 'E08', grupo: 'operador-é', titulo: 'é_igualim e é_tipo_de ao lado de é', gs: L('uai ok é 2 é_igualim 2;', 'uai d é faz_um Date() é_tipo_de Date;', 'prosa(ok, d);'), esperado: 'true true', classe: 'controle' },
  { id: 'E09', grupo: 'operador-é', titulo: 'tabulação em vez de espaço: `uai\\tx\\té\\t5`', gs: 'uai\tx\té\t5;\nprosa(x);', esperado: '5', classe: 'controle' },

  // ---------- Unicode: NFC x NFD ----------
  { id: 'U01', grupo: 'unicode', titulo: '`é` decomposto (e + U+0301) — texto idêntico na tela', gs: 'uai x é 5; prosa(x);', esperado: '5', sev: 'MEDIUM', classe: 'defeito', nota: 'o transpilador não normaliza a entrada para NFC; arquivo salvo/colado em macOS/web costuma vir NFD' },
  { id: 'U02', grupo: 'unicode', titulo: '`se_não` e `ocê` decompostos', gs: L('arruma_trem A { aprepara_trem() { ocê.v é 1; } }', 'se_ocê_quiser (de_jeito_nenhum) { prosa("a"); } se_não { prosa("b"); }'), esperado: 'b', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'U03', grupo: 'unicode', titulo: 'identificador `café` (NFC) com keyword colada', gs: 'uai café é 1; uai cafemais é 2; prosa(café mais cafemais);', esperado: '3', classe: 'controle' },

  // ---------- quebras de linha / BOM / ASI ----------
  { id: 'L01', grupo: 'formato', titulo: 'CRLF (arquivo Windows)', gs: 'uai x é 5;\r\nprosa(x);\r\n', esperado: '5', classe: 'controle' },
  { id: 'L02', grupo: 'formato', titulo: 'BOM (U+FEFF) no começo', gs: '﻿uai x é 5;\nprosa(x);', esperado: '5', classe: 'controle' },
  { id: 'L03', grupo: 'formato', titulo: 'ASI: sem ponto-e-vírgula (estilo do README)', gs: L('uai nome é "Goiás"', 'uai numeros é [1, 2, 3]', 'prosa("Bem-vindo ao", nome)', 'uai dobrados é numeros.mapear(x => x vezes 2)', 'prosa("Dobrados:", dobrados)'), esperado: 'Bem-vindo ao Goiás\nDobrados: [ 2, 4, 6 ]', classe: 'controle' },
  { id: 'L04', grupo: 'formato', titulo: 'expressão multilinha com operador no começo da linha', gs: L('uai soma é 1', '  mais 2', '  mais 3', 'prosa(soma)'), esperado: '6', classe: 'controle' },
  { id: 'L05', grupo: 'formato', titulo: 'linhas do JS gerado == linhas do .gs (mapeamento 1:1 do código do usuário)', gs: L('trem a;', 'trem b;', 'b é', '  2;', 'a é 1;', 'prosa(a, b);'), check: r => ({ ok: r.transpiled && lineCount(r.user) === 6, detalhe: `linhas na saída=${r.user && lineCount(r.user)} (entrada tem 6)` }), sev: 'MEDIUM', classe: 'defeito' },

  // ---------- validação (_validateSyntax) ----------
  { id: 'V01', grupo: 'validacao', titulo: 'objeto compacto aninhado `{a:{b:{c:1}}}` (contém `}}}`)', gs: 'uai o é {a:{b:{c:1}}}; prosa(o.a.b.c);', esperado: '1', sev: 'MEDIUM', classe: 'defeito', nota: 'heurística de "chaves desbalanceadas" marca qualquer `}}}` ou `{{{`' },
  { id: 'V02', grupo: 'validacao', titulo: 'string com `{{{nome}}}` (mustache)', gs: 'prosa("<p>{{{nome}}}</p>");', esperado: '<p>{{{nome}}}</p>', sev: 'LOW', classe: 'defeito' },
  { id: 'V03', grupo: 'validacao', titulo: 'comentário final com `{{{`', gs: 'uai x é 1; // {{{ início de região\nprosa(x);', esperado: '1', sev: 'LOW', classe: 'defeito' },
  { id: 'V04', grupo: 'validacao', titulo: 'JS sintaticamente quebrado deve ser reprovado na tradução', gs: 'uai x é (;', check: r => ({ ok: !r.transpiled, detalhe: r.transpiled ? `transpile=success; só falha ao executar: ${r.run && r.run.error}` : '' }), sev: 'HIGH', classe: 'defeito', nota: 'não há parser nem checagem do JS gerado; `vê_se_tá_certo` aprova código inválido' },
  { id: 'V05', grupo: 'validacao', titulo: 'anotação de tipo em declaração `uai nome: texto é "a"` (controle)', gs: 'uai nome: texto é "Ana"; prosa(nome);', esperado: 'Ana', classe: 'controle' },
  { id: 'V06', grupo: 'validacao', titulo: 'anotação de tipo em parâmetros/retorno de função', gs: L('faz_trem soma(a: numero, b: numero): numero { faz_favor a mais b; }', 'prosa(soma(1, 2));'), esperado: '3', sev: 'LOW', classe: 'limite-de-design', nota: 'só declarações `uai/trem x: tipo é` têm anotação removida' },
  { id: 'V07', grupo: 'validacao', titulo: 'anotação em identificador acentuado `uai número: numero é 5`', gs: 'uai número: numero é 5; prosa(número);', esperado: '5', sev: 'LOW', classe: 'defeito', nota: '\\w+ não casa letras acentuadas' },
  { id: 'V08', grupo: 'validacao', titulo: '`uai x;` sem valor é rejeitado (controle)', gs: 'uai x;', check: r => ({ ok: !r.transpiled, detalhe: r.transpiled ? 'aceitou' : r.transpileError }), classe: 'controle' },

  // ---------- avisos / diagnósticos do transpilador ----------
  { id: 'W01', grupo: 'aviso', titulo: 'programa que só usa `prosa` não deve receber aviso de método proibido', gs: 'prosa("oi");', check: r => ({ ok: r.transpiled && r.warnings.length === 0, detalhe: `avisos=${JSON.stringify(r.warnings)}` }), sev: 'MEDIUM', classe: 'defeito', nota: 'o aviso roda DEPOIS do mapeamento prosa->console.log: 100% dos programas com prosa recebem o aviso falso' },
  { id: 'W02', grupo: 'aviso', titulo: 'documentado: `nome.replace(...)` gera aviso "use trocar"', gs: 'uai n é "abc"; prosa(n.replace("a", "b"));', check: r => ({ ok: r.transpiled && r.warnings.some(w => /replace|trocar/.test(w) && !/console\.log/.test(w)), detalhe: `avisos=${JSON.stringify(r.warnings)}` }), sev: 'LOW', classe: 'defeito', nota: 'METODOS_GOIANOS.md promete aviso; _convertJSMethodsToGoiano reescreve antes e _checkForbiddenMethods nunca vê o método' },
];
