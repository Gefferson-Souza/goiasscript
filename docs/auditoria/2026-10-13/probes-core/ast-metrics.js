'use strict';
// Métricas estáticas dos arquivos do núcleo com @babel/parser + @babel/traverse (já presentes no node_modules; nada instalado).
// Mede: tamanho de arquivo/função, aninhamento, comentários (classificação R1-R4), console.*, eval, reatribuições, mutações, identificadores.
const fs = require('fs');
const path = require('path');
const PNPM = '<repo>/node_modules/.pnpm';
const parser = require(`${PNPM}/@babel+parser@7.29.3/node_modules/@babel/parser`);
const traverse = require(`${PNPM}/@babel+traverse@7.29.0/node_modules/@babel/traverse`).default;

const ROOT = '<repo>/packages/core/src';
const FILES = [
  'compiler.js',
  'browser.js',
  'compiler/simpleTranspiler.js',
  'compiler/lexer.js',
  'goianoMethods/GoianoBuiltins.js',
  'errors/ErroGoiano.js',
  'errors/errorTranslator.js',
];

const NESTING_NODES = new Set(['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement', 'TryStatement', 'SwitchStatement', 'CatchClause']);
const FUNCTION_NODES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ClassMethod', 'ObjectMethod', 'ClassPrivateMethod']);

function fnName(p) {
  const n = p.node;
  if (n.id && n.id.name) return n.id.name;
  if (n.key && (n.key.name || n.key.value)) return n.key.name || String(n.key.value);
  const parent = p.parent;
  if (parent && parent.type === 'VariableDeclarator' && parent.id.name) return parent.id.name;
  if (parent && parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression') return `${parent.left.property.name}`;
  if (parent && parent.type === 'CallExpression') return '(callback)';
  return '(anônima)';
}

function maxNesting(fnPath) {
  let max = 0;
  function walk(node, depth, isElseIf) {
    if (!node || typeof node.type !== 'string') return;
    let d = depth;
    const nests = NESTING_NODES.has(node.type) && node.type !== 'CatchClause';
    if (nests && !isElseIf) d = depth + 1;
    if (node.type === 'CatchClause') d = depth + 1;
    if (FUNCTION_NODES.has(node.type) && node !== fnPath.node) d = depth + 1;
    if (d > max) max = d;
    for (const key of Object.keys(node)) {
      if (['loc', 'start', 'end', 'leadingComments', 'trailingComments', 'innerComments', 'extra', 'type'].includes(key)) continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(c => walk(c, d, false));
      else if (child && typeof child.type === 'string') {
        const elseIf = node.type === 'IfStatement' && key === 'alternate' && child.type === 'IfStatement';
        walk(child, d, elseIf);
      }
    }
  }
  walk(fnPath.node, 0, false);
  return max;
}

const out = { files: {} };
const identifiersByFile = {};

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const ast = parser.parse(source, { sourceType: 'script', errorRecovery: true, tokens: false });
  const info = {
    linhasTotais: lines.length,
    linhasEmBranco: lines.filter(l => !l.trim()).length,
    funcoes: [],
    comentarios: { jsdoc: 0, bloco: 0, linha: 0, linhasOcupadas: 0, maioresBlocos: [] },
    consoleCalls: [],
    evalCalls: [],
    reatribuicoes: 0,
    reatribuicaoDeParametro: 0,
    chamadasPush: 0,
    atribuicoesAMembro: 0,
    declaracoesVar: 0,
    declaracoesLet: 0,
    declaracoesConst: 0,
    eslintDisable: [],
    todos: [],
    emojisEmComentarios: 0,
  };

  // comentários
  const comments = ast.comments || [];
  // agrupa // consecutivos em "blocos"
  let run = null;
  const runs = [];
  for (const c of comments) {
    const startLine = c.loc.start.line;
    const endLine = c.loc.end.line;
    info.comentarios.linhasOcupadas += endLine - startLine + 1;
    if (c.type === 'CommentBlock') {
      if (c.value.startsWith('*')) info.comentarios.jsdoc += 1;
      else info.comentarios.bloco += 1;
      runs.push({ start: startLine, end: endLine, text: c.value.trim().split('\n')[0].trim().slice(0, 70) });
      run = null;
    } else {
      info.comentarios.linha += 1;
      if (run && startLine === run.end + 1) {
        run.end = startLine;
      } else {
        run = { start: startLine, end: startLine, text: c.value.trim().slice(0, 70) };
        runs.push(run);
      }
    }
    if (/eslint-disable/.test(c.value)) info.eslintDisable.push({ linha: startLine, texto: c.value.trim() });
    if (/TODO|FIXME|XXX/.test(c.value)) info.todos.push({ linha: startLine, texto: c.value.trim().slice(0, 80) });
    if (/\p{Extended_Pictographic}/u.test(c.value)) info.emojisEmComentarios += 1;
  }
  info.comentarios.maioresBlocos = runs
    .map(r => ({ linhas: r.end - r.start + 1, de: r.start, ate: r.end, texto: r.text }))
    .filter(r => r.linhas > 4)
    .sort((a, b) => b.linhas - a.linhas)
    .slice(0, 8);
  info.comentarios.blocosMaioresQue4 = runs.filter(r => r.end - r.start + 1 > 4).length;

  const ids = new Set();
  traverse(ast, {
    Function(p) {
      const n = p.node;
      const start = n.loc.start.line;
      const end = n.loc.end.line;
      info.funcoes.push({
        nome: fnName(p),
        tipo: n.type,
        de: start,
        ate: end,
        linhas: end - start + 1,
        params: n.params.length,
        aninhamentoMax: maxNesting(p),
      });
      n.params.forEach(prm => {
        if (prm.type === 'Identifier') ids.add(`param:${prm.name}`);
        if (prm.type === 'AssignmentPattern' && prm.left.type === 'Identifier') ids.add(`param:${prm.left.name}`);
        if (prm.type === 'RestElement' && prm.argument.type === 'Identifier') ids.add(`param:${prm.argument.name}`);
      });
      if (n.id && n.id.name) ids.add(`função:${n.id.name}`);
    },
    ClassDeclaration(p) { if (p.node.id) ids.add(`classe:${p.node.id.name}`); },
    ClassMethod(p) { if (p.node.key && p.node.key.name) ids.add(`método:${p.node.key.name}`); },
    VariableDeclaration(p) {
      if (p.node.kind === 'var') info.declaracoesVar += 1;
      if (p.node.kind === 'let') info.declaracoesLet += 1;
      if (p.node.kind === 'const') info.declaracoesConst += 1;
    },
    VariableDeclarator(p) {
      if (p.node.id.type === 'Identifier') ids.add(`var:${p.node.id.name}`);
      if (p.node.id.type === 'ObjectPattern') p.node.id.properties.forEach(pr => pr.value && pr.value.name && ids.add(`var:${pr.value.name}`));
    },
    CatchClause(p) { if (p.node.param && p.node.param.name) ids.add(`catch:${p.node.param.name}`); },
    CallExpression(p) {
      const c = p.node.callee;
      if (c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'console') {
        info.consoleCalls.push({ linha: p.node.loc.start.line, metodo: c.property.name });
      }
      if (c.type === 'Identifier' && c.name === 'eval') info.evalCalls.push({ linha: p.node.loc.start.line });
      if (c.type === 'MemberExpression' && c.property.name === 'push') info.chamadasPush += 1;
    },
    AssignmentExpression(p) {
      const l = p.node.left;
      if (l.type === 'Identifier') {
        info.reatribuicoes += 1;
        const binding = p.scope.getBinding(l.name);
        if (binding && binding.kind === 'param') info.reatribuicaoDeParametro += 1;
      }
      if (l.type === 'MemberExpression') info.atribuicoesAMembro += 1;
    },
  });
  identifiersByFile[rel] = [...ids].sort();
  out.files[rel] = info;
}

// ---- impressão ----
const pad = (s, n) => String(s).padEnd(n);
console.log('=== Tamanho dos arquivos ===');
console.log(pad('arquivo', 36), pad('linhas', 7), pad('em branco', 10), pad('comentários(linhas)', 20), pad('funções', 8), 'maior função');
for (const [rel, i] of Object.entries(out.files)) {
  const big = [...i.funcoes].sort((a, b) => b.linhas - a.linhas)[0];
  console.log(pad(rel, 36), pad(i.linhasTotais, 7), pad(i.linhasEmBranco, 10), pad(i.comentarios.linhasOcupadas, 20), pad(i.funcoes.length, 8), big ? `${big.nome} (${big.linhas} linhas, L${big.de}-${big.ate})` : '-');
}

console.log('\n=== Funções com mais de 50 linhas ou aninhamento > 4 ===');
for (const [rel, i] of Object.entries(out.files)) {
  for (const f of i.funcoes.filter(f => f.linhas > 50 || f.aninhamentoMax > 4)) {
    console.log(`${rel}:${f.de}-${f.ate}  ${f.nome}  linhas=${f.linhas}  aninhamento=${f.aninhamentoMax}`);
  }
}
console.log('\n=== Distribuição: funções (total / >50 linhas / aninhamento máx) ===');
for (const [rel, i] of Object.entries(out.files)) {
  const maxNest = Math.max(0, ...i.funcoes.map(f => f.aninhamentoMax));
  console.log(pad(rel, 36), `total=${i.funcoes.length}`, `>50=${i.funcoes.filter(f => f.linhas > 50).length}`, `aninhamentoMax=${maxNest}`);
}

console.log('\n=== Comentários ===');
for (const [rel, i] of Object.entries(out.files)) {
  const c = i.comentarios;
  console.log(`${pad(rel, 36)} jsdoc=${c.jsdoc} bloco=${c.bloco} linha(//)=${c.linha} linhasOcupadas=${c.linhasOcupadas} blocos>4linhas=${c.blocosMaioresQue4} emojis=${i.emojisEmComentarios} TODOs=${i.todos.length} eslint-disable=${i.eslintDisable.length}`);
  c.maioresBlocos.forEach(b => console.log(`      bloco de ${b.linhas} linhas em L${b.de}-${b.ate}: ${b.texto}`));
  i.eslintDisable.forEach(e => console.log(`      eslint-disable L${e.linha}: ${e.texto}`));
}

console.log('\n=== console.*, eval, mutação ===');
for (const [rel, i] of Object.entries(out.files)) {
  console.log(`${pad(rel, 36)} console=${i.consoleCalls.length}${i.consoleCalls.length ? ' (' + i.consoleCalls.map(c => `L${c.linha}:${c.metodo}`).join(', ') + ')' : ''} eval=${i.evalCalls.length}${i.evalCalls.length ? ' (L' + i.evalCalls.map(e => e.linha).join(',L') + ')' : ''} reatribuições=${i.reatribuicoes} (de parâmetro: ${i.reatribuicaoDeParametro}) push()=${i.chamadasPush} atribuições-a-membro=${i.atribuicoesAMembro} var/let/const=${i.declaracoesVar}/${i.declaracoesLet}/${i.declaracoesConst}`);
}

fs.writeFileSync(path.join(__dirname, 'ast-metrics.json'), JSON.stringify({ ...out, identifiersByFile }, null, 2));
console.log('\n=== Identificadores declarados (únicos por arquivo) — para classificação manual de idioma ===');
for (const [rel, list] of Object.entries(identifiersByFile)) {
  console.log(`\n# ${rel} (${list.length})`);
  console.log(list.join(' '));
}
