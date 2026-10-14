'use strict';
// Métricas estáticas dos arquivos do escopo: tamanho, funções longas, aninhamento, comentários,
// console.*, process.exit, eval/child_process, identificadores não-ASCII e (heurística) em português.
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(process.env.REPO, 'node_modules/.pnpm/acorn@8.16.0/node_modules/acorn'));
const walk = require(path.join(process.env.REPO, 'node_modules/.pnpm/acorn-walk@8.3.2/node_modules/acorn-walk'));

const files = process.argv.slice(2);

// Heurística (HIPÓTESE): fragmentos de palavras portuguesas vistos nos fontes; serve só para contagem aproximada.
const PT_WORDS = new Set([
  'arquivo', 'caminho', 'codigo', 'completo', 'resultado', 'erro', 'diretorio', 'nome', 'saudacao', 'mensagem',
  'exemplo', 'funcao', 'projeto', 'tecnologias', 'historia', 'história', 'prosa', 'traduz', 'bota', 'moer',
  'barraco', 'dedo', 'tralha', 'terreiro', 'limpa', 'zera', 'trem', 'lembra', 'desenrola', 'mostra', 'vaza',
  'aviso', 'avisos', 'opcoes', 'saida', 'sucesso', 'cabô', 'roda', 'boas', 'vindas', 'goianos', 'metodos',
  'métodos', 'tá', 'certo', 'vê', 'se', 'pra', 'aí', 'os', 'a', 'o', 'de', 'da', 'do', 'em', 'um', 'uma',
  'main', 'instalacao', 'dependencias', 'numero', 'sorte', 'versao', 'autor', 'executar', 'compilar', 'documentacao',
  'tipos', 'simbolos', 'tabela', 'ordenar', 'linha', 'texto', 'lista', 'valor', 'variaveis', 'variavel',
]);
const splitWords = id => id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().split(/[_$]+/).filter(Boolean);

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const comments = [];
  const ast = acorn.parse(src, {
    ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true,
    onComment: (block, text, start, end, locStart, locEnd) => comments.push({ block, text, line: locStart.line, endLine: locEnd.line }),
  });

  const fns = [];
  let maxDepth = 0;
  const stats = { consoleLog: 0, consoleError: 0, consoleWarn: 0, consoleOther: 0, processExit: 0, evalCalls: 0, childProcess: 0, requires: [], catches: 0, emptyCatch: 0, strings: new Map() };

  const nameOf = (node, parent) => {
    if (node.id) return node.id.name;
    if (parent && parent.type === 'MethodDefinition') return parent.key.name || parent.key.value;
    if (parent && parent.type === 'Property') return parent.key.name || parent.key.value;
    if (parent && parent.type === 'VariableDeclarator') return parent.id.name;
    return '<anônima>';
  };

  walk.ancestor(ast, {
    Function(node, _state, ancestors) {
      const parent = ancestors[ancestors.length - 2];
      fns.push({ name: nameOf(node, parent), start: node.loc.start.line, end: node.loc.end.line, len: node.loc.end.line - node.loc.start.line + 1 });
    },
    CallExpression(node) {
      const c = node.callee;
      if (c.type === 'MemberExpression' && c.object.name === 'console') {
        const m = c.property.name;
        if (m === 'log') stats.consoleLog++; else if (m === 'error') stats.consoleError++; else if (m === 'warn') stats.consoleWarn++; else stats.consoleOther++;
      }
      if (c.type === 'MemberExpression' && c.object.name === 'process' && c.property.name === 'exit') stats.processExit++;
      if (c.type === 'Identifier' && c.name === 'eval') stats.evalCalls++;
      if (c.type === 'Identifier' && c.name === 'require' && node.arguments[0] && node.arguments[0].type === 'Literal') {
        stats.requires.push(node.arguments[0].value);
        if (node.arguments[0].value === 'child_process') stats.childProcess++;
      }
    },
    CatchClause(node) {
      stats.catches++;
      if (node.body.body.length === 0) stats.emptyCatch++;
    },
    Literal(node) {
      if (typeof node.value === 'string' && node.value.length > 1) {
        stats.strings.set(node.value, (stats.strings.get(node.value) || 0) + 1);
      }
    },
  });

  // profundidade máxima de aninhamento (blocos/if/for/while/try/switch dentro de funções)
  const NEST = new Set(['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement', 'TryStatement', 'SwitchStatement', 'CatchClause']);
  const depthWalk = (node, depth) => {
    if (!node || typeof node.type !== 'string') return;
    const next = NEST.has(node.type) ? depth + 1 : depth;
    if (next > maxDepth) maxDepth = next;
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && depthWalk(c, next));
      else if (v && typeof v.type === 'string') depthWalk(v, next);
    }
  };
  depthWalk(ast, 0);

  // identificadores (tokens do tipo nome) — declarados em funções, métodos, variáveis, parâmetros, propriedades
  const idents = new Map();
  for (const tok of acorn.tokenizer(src, { ecmaVersion: 'latest', allowHashBang: true })) {
    if (tok.type.label === 'name') idents.set(tok.value, (idents.get(tok.value) || 0) + 1);
  }
  const nonAscii = [...idents.keys()].filter(i => /[^\x00-\x7F]/.test(i));
  const ptLike = [...idents.keys()].filter(i => {
    const w = splitWords(i);
    return w.some(x => PT_WORDS.has(x) && x.length > 3) || /[^\x00-\x7F]/.test(i);
  });

  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/*')).length;
  const commentLines = comments.reduce((a, c) => a + (c.endLine - c.line + 1), 0);
  const longFns = fns.filter(f => f.len > 50).sort((a, b) => b.len - a.len);
  const trailing = comments.filter(c => { const l = lines[c.line - 1]; return l.slice(0, l.indexOf('//')).trim().length > 0 && !c.block; });
  const repeated = [...stats.strings.entries()].filter(([s, n]) => n >= 3 && s.length >= 3).sort((a, b) => b[1] - a[1]).slice(0, 8);

  console.log(`\n=== ${path.relative(process.env.CORE, file)} ===`);
  console.log(`linhas totais: ${lines.length} | linhas de código (aprox.): ${codeLines} | linhas de comentário: ${commentLines} (${comments.length} comentários, ${trailing.length} "ao lado" do código)`);
  console.log(`funções/métodos: ${fns.length} | > 50 linhas: ${longFns.length} -> ${longFns.map(f => `${f.name}=${f.len}`).join(', ') || '-'}`);
  console.log(`maior função: ${fns.slice().sort((a, b) => b.len - a.len)[0].name} (${fns.slice().sort((a, b) => b.len - a.len)[0].len} linhas)`);
  console.log(`profundidade máx. de aninhamento (if/for/try...): ${maxDepth}`);
  console.log(`console.log=${stats.consoleLog} console.error=${stats.consoleError} console.warn=${stats.consoleWarn} outros=${stats.consoleOther} | process.exit=${stats.processExit} | eval=${stats.evalCalls} | child_process=${stats.childProcess}`);
  console.log(`catch: ${stats.catches} (vazios: ${stats.emptyCatch}) | requires: ${[...new Set(stats.requires)].join(', ')}`);
  console.log(`identificadores distintos: ${idents.size} | não-ASCII: ${nonAscii.length} -> ${nonAscii.join(', ') || '-'}`);
  console.log(`identificadores com palavra portuguesa (heurística, HIPÓTESE): ${ptLike.length} -> ${ptLike.slice(0, 40).join(', ')}`);
  console.log(`strings literais repetidas >=3x: ${repeated.map(([s, n]) => `"${s.length > 30 ? s.slice(0, 30) + '…' : s}"×${n}`).join(' | ') || '-'}`);
}
