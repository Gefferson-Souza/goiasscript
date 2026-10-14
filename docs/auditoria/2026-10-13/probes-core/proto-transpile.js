'use strict';
// PROVA DE CONCEITO (não é entrega): transpilador por TOKENS usando acorn.tokenizer (já presente no node_modules do repo).
// Reaproveita a tabela de keywords do próprio simpleTranspiler.js; não injeta runtime; preserva a contagem de linhas;
// valida o JS gerado com acorn.parse e devolve erro com a linha do .gs.
const fs = require('fs');
const PNPM = '<repo>/node_modules/.pnpm';
const acorn = require(`${PNPM}/acorn@8.16.0/node_modules/acorn`);
const parser = require(`${PNPM}/@babel+parser@7.29.3/node_modules/@babel/parser`);
const traverse = require(`${PNPM}/@babel+traverse@7.29.0/node_modules/@babel/traverse`).default;

const SRC = '<repo>/packages/core/src/compiler/simpleTranspiler.js';
const KEYWORDS = new Map();
traverse(parser.parse(fs.readFileSync(SRC, 'utf8'), { sourceType: 'script' }), {
  VariableDeclarator(p) {
    if (p.node.id.name === 'mappings' && p.node.init && p.node.init.type === 'ArrayExpression') {
      for (const e of p.node.init.elements) KEYWORDS.set(e.elements[0].value, e.elements[1].value);
    }
  },
});
// palavras que só valem dentro do cabeçalho de vai_indo (...)
const FOR_ONLY = new Set(['em', 'de']);
// aliases de método (goiano -> JS), aplicados só depois de `.`; substituem o runtime de protótipos
const METHOD_ALIASES = {
  mapear: 'map', filtrar: 'filter', reduzir: 'reduce', pra_cada: 'forEach', empurrar: 'push', tirar_ultimo: 'pop',
  tirar_primeiro: 'shift', por_primeiro: 'unshift', ordenar: 'sort', inverter: 'reverse', achar: 'find', juntar_lista: 'concat',
  emendar: 'splice', dividir: 'split', juntar: 'join', pra_maiusculo: 'toUpperCase', pra_minusculo: 'toLowerCase', aparar: 'trim',
  contem: 'includes', posicao_de: 'indexOf', pedaco: 'substring', fatiar: 'slice', letra_em: 'charAt', comeca_com: 'startsWith',
  termina_com: 'endsWith', trocar: 'replaceAll', tem_propriedade: 'hasOwnProperty', quando_resolver: 'then', se_der_pobrema: 'catch',
  pegar_ano: 'getFullYear', pegar_mes: 'getMonth', pegar_dia: 'getDate', pegar_horas: 'getHours', pegar_minutos: 'getMinutes', pegar_segundos: 'getSeconds',
  chaves: 'keys', valores: 'values', entradas: 'entries', misturar: 'assign',
};
const MATH = { sorteio: 'random', arredondar: 'round', arredondar_baixo: 'floor', arredondar_cima: 'ceil', maior: 'max', menor: 'min', absoluto: 'abs', raiz_quadrada: 'sqrt', potencia: 'pow', PI: 'PI', E: 'E' };
const GLOBALS = { vira_numero: 'parseInt', vira_decimal: 'parseFloat', eh_nao_numero: 'isNaN', depois_de: 'setTimeout', repetir_a_cada: 'setInterval', cancelar_depois: 'clearTimeout', cancelar_repeticao: 'clearInterval', prosa_erro: 'console.error', prosa_aviso: 'console.warn' };

const own = (table, key) => (Object.hasOwn(table, key) ? table[key] : undefined);

function transpile(input) {
  if (typeof input !== 'string') return { ok: false, error: { message: 'O código precisa ser um texto, sô.', line: 0, column: 0 } };
  const code = input.replace(/^﻿/, '').normalize('NFC');
  const tokens = [];
  try {
    for (const t of acorn.tokenizer(code, { ecmaVersion: 'latest', locations: true })) tokens.push(t);
  } catch (error) {
    return { ok: false, error: { message: error.message.replace(/ \(\d+:\d+\)$/, ''), line: error.loc && error.loc.line, column: error.loc && error.loc.column } };
  }
  const edits = [];
  let forState = 0; // 0 fora; 1 viu vai_indo; >=2 dentro do cabeçalho (profundidade = forState - 1)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];
    const next = tokens[i + 1];
    const text = code.slice(t.start, t.end);
    if (forState >= 2 && t.type.label === '(') forState += 1;
    if (forState >= 2 && t.type.label === ')') forState -= 1;
    if (forState === 1 && t.type.label === '(') forState = 2;
    if (forState === 1 && t.type.label !== '(') forState = 0;
    if (forState === 2 && t.type.label === ')') forState = 0;
    if (t.type.label !== 'name') continue;
    const afterDot = prev && (prev.type.label === '.' || prev.type.label === '?.');
    const objectKey = prev && (prev.type.label === '{' || prev.type.label === ',') && next && next.type.label === ':';
    if (afterDot) {
      if (text === 'tamanho' && next && next.type.label === '(' && tokens[i + 2] && tokens[i + 2].type.label === ')') {
        edits.push([t.start, tokens[i + 2].end, 'length']);
        i += 2;
      } else if (own(METHOD_ALIASES, text)) {
        edits.push([t.start, t.end, own(METHOD_ALIASES, text)]);
      }
      continue;
    }
    if (objectKey) continue;
    if (text === 'GoianoMath' && next && next.type.label === '.' && tokens[i + 2] && own(MATH, code.slice(tokens[i + 2].start, tokens[i + 2].end))) {
      const member = tokens[i + 2];
      edits.push([t.start, t.end, 'Math'], [member.start, member.end, own(MATH, code.slice(member.start, member.end))]);
      i += 2;
      continue;
    }
    if (own(GLOBALS, text)) { edits.push([t.start, t.end, own(GLOBALS, text)]); continue; }
    if (text === 'vai_indo') forState = 1;
    if (FOR_ONLY.has(text) && forState < 2) continue;
    if (KEYWORDS.has(text)) edits.push([t.start, t.end, KEYWORDS.get(text)]);
  }
  let out = '';
  let cursor = 0;
  for (const [start, end, replacement] of edits.sort((a, b) => a[0] - b[0])) {
    out += code.slice(cursor, start) + replacement;
    cursor = end;
  }
  out += code.slice(cursor);
  try {
    acorn.parse(out, { ecmaVersion: 'latest', locations: true, allowReturnOutsideFunction: false });
  } catch (error) {
    return { ok: false, code: out, error: { message: error.message.replace(/ \(\d+:\d+\)$/, ''), line: error.loc && error.loc.line, column: error.loc && error.loc.column } };
  }
  return { ok: true, code: out };
}

module.exports = { transpile, KEYWORDS };
