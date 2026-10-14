'use strict';
// Cruza as tabelas do núcleo: keywords (lexer x transpilador), métodos (metodosGoianos x reescrita x runtime x lista de proibidos).
const fs = require('fs');
const path = require('path');
const PNPM = '<repo>/node_modules/.pnpm';
const parser = require(`${PNPM}/@babel+parser@7.29.3/node_modules/@babel/parser`);
const traverse = require(`${PNPM}/@babel+traverse@7.29.0/node_modules/@babel/traverse`).default;
const { CORE_SRC, SimpleTranspiler, GoianoBuiltins, RUNTIME, transpile } = require('./harness');
const Lexer = require(`${CORE_SRC}/compiler/lexer`);

// ---- 1) mappings do transpilador, extraídos do AST (fonte da verdade = o código) ----
const tsrc = fs.readFileSync(`${CORE_SRC}/compiler/simpleTranspiler.js`, 'utf8');
const ast = parser.parse(tsrc, { sourceType: 'script' });
let mappings = [];
traverse(ast, {
  VariableDeclarator(p) {
    if (p.node.id.name === 'mappings' && p.node.init && p.node.init.type === 'ArrayExpression') {
      mappings = p.node.init.elements.map(e => [e.elements[0].value, e.elements[1].value, e.loc.start.line]);
    }
  },
});
const unique = new Map();
const dupes = [];
for (const [k, v, line] of mappings) {
  if (unique.has(k)) dupes.push(`${k} (linhas ${unique.get(k).line} e ${line})`);
  else unique.set(k, { v, line });
}
console.log('=== 1) Tabela de keywords do transpilador (simpleTranspiler.js) ===');
console.log(`entradas=${mappings.length} únicas=${unique.size} duplicadas=${dupes.length}: ${dupes.join('; ')}`);
const valueClash = new Map();
for (const [k, { v }] of unique) valueClash.set(v, [...(valueClash.get(v) || []), k]);
console.log('mesmo valor JS para mais de uma keyword: ' + [...valueClash].filter(([, ks]) => ks.length > 1).map(([v, ks]) => `${v} <- ${ks.join(' | ')}`).join('; '));

// ---- 2) keywords do lexer ----
const lex = new Lexer().keywords;
const lexKeys = new Set(Object.keys(lex));
const trKeys = new Set(unique.keys());
const onlyLexer = [...lexKeys].filter(k => !trKeys.has(k));
const onlyTranspiler = [...trKeys].filter(k => !lexKeys.has(k));
const different = [...lexKeys].filter(k => trKeys.has(k) && lex[k] !== unique.get(k).v).map(k => `${k}: lexer=${lex[k]} transpilador=${unique.get(k).v}`);
console.log('\n=== 2) Lexer (lexer.js, código morto) x transpilador ===');
console.log(`keywords no lexer=${lexKeys.size}, no transpilador=${trKeys.size}`);
console.log(`só no lexer (${onlyLexer.length}): ${onlyLexer.join(', ')}`);
console.log(`só no transpilador (${onlyTranspiler.length}): ${onlyTranspiler.join(', ')}`);
console.log(`mesmo nome, valor diferente (${different.length}): ${different.join('; ') || '-'}`);

// ---- 3) documentação promete keywords que não existem na tabela? ----
console.log('\n=== 3) Keywords citadas na documentação/exemplos que o transpilador NÃO traduz ===');
const claimed = {
  'presta_serviço (README da extensão, exemplos, templates do arma_o_barraco, lexer)': 'presta_serviço f() {}',
  'vai_na_frente presta_serviço (CONTRIBUTING.md:177)': 'vai_na_frente presta_serviço f() {}',
  'mexe_assim (exemplos advanced)': 'mexe_assim f() {}',
  'é_igual_a (template projeto-basico/tests)': 'x é_igual_a 1',
  'vixe_que (exemplo teste_erros + .github/copilot-instructions.md)': 'vixe_que("a")',
  'se (METODOS_GOIANOS.md:309 e CLAUDE.md local)': 'se (x) { }',
  'senao (CLAUDE.md local)': 'senao { }',
  'fazer (CLAUDE.md local: "alias simples" de function)': 'fazer f() {}',
  'vazio / sei_lá (tabela do lexer)': 'uai x é vazio; uai y é sei_lá;',
};
for (const [label, snippet] of Object.entries(claimed)) {
  const t = transpile(snippet);
  const body = t.success ? t.code.split('\n').slice(247).join('\n').trim() : `(falhou: ${t.error.message})`;
  const kept = /presta_serviço|mexe_assim|é_igual_a|vixe_que|\bse\b|senao|fazer|vazio|sei_lá/.test(body);
  console.log(`${kept ? 'NÃO TRADUZ' : 'traduz    '} | ${label}\n             entrada: ${snippet}  ->  ${body}`);
}

// ---- 4) metodosGoianos: reescrita x runtime x lista de proibidos ----
console.log('\n=== 4) metodosGoianos (GoianoBuiltins) x _convertJSMethodsToGoiano x runtime x metodosProibidos ===');
const b = new GoianoBuiltins();
const rows = [];
for (const [js, goiano] of Object.entries(b.metodosGoianos)) {
  const dotted = js.includes('.');
  const sample = dotted ? `${js}(1)` : `x.${js}(1)`;
  const t = transpile(`${sample};`);
  const out = t.success ? t.code.split('\n').slice(247).join('\n') : '';
  const rewritten = out.includes(goiano);
  const goianoLeaf = goiano;
  const inRuntime = new RegExp(`(\\.|\\bfunction )${goianoLeaf}\\b|\\b${goianoLeaf}\\s*=`).test(RUNTIME);
  const forbidden = b.metodosProibidos.includes(js);
  rows.push({ js, goiano, rewritten, inRuntime, forbidden });
}
const noRewrite = rows.filter(r => !r.rewritten);
const noRuntime = rows.filter(r => !r.inRuntime);
console.log(`entradas em metodosGoianos=${rows.length}`);
console.log(`sem regra de reescrita (${noRewrite.length}): ${noRewrite.map(r => `${r.js}->${r.goiano}`).join(', ')}`);
console.log(`sem implementação no runtime (${noRuntime.length}): ${noRuntime.map(r => `${r.js}->${r.goiano}`).join(', ') || '-'}`);
const forbiddenNoWarning = rows.filter(r => r.forbidden);
console.log(`na lista metodosProibidos=${b.metodosProibidos.length}; conversões por método proibido dão aviso? Testando 'x.${'replace'}(1)':`);
const t = transpile('const x = "a"; x.replace("a", "b"); x.trim(); [].map(f => f); parseInt("1"); setTimeout(f, 1);');
console.log('   avisos emitidos: ' + JSON.stringify((t.warnings || []).map(w => w.message.slice(0, 60))));
const tf = new SimpleTranspiler();
const lista1 = ['.replace(', '.split(', '.join(', '.toUpperCase()', '.toLowerCase()', '.map(', '.filter(', '.reduce(', '.forEach(', '.push(', '.pop()', 'Math.random()', 'Math.floor(', 'console.log(', 'parseInt(', 'setTimeout('];
console.log(`   lista de _checkForbiddenMethods (${lista1.length}) vs metodosProibidos (${b.metodosProibidos.length}): só em _check: ${lista1.filter(m => !b.metodosProibidos.some(p => m.includes(p))).join(', ') || '-'} | só em metodosProibidos: ${b.metodosProibidos.filter(p => !lista1.some(m => m.includes(p))).join(', ') || '-'}`);

// ---- 5) runtime define aliases que nenhuma regra reescreve (superfície só para o usuário) ----
const runtimeNames = [...RUNTIME.matchAll(/(?:String|Array|Object|Date)\.prototype\.(\w+)\s*=|Object\.(\w+)\s*=|^function (\w+)\(/gm)].map(m => m[1] || m[2] || m[3]);
const goianoNamesInTable = new Set(Object.values(b.metodosGoianos).map(v => v.replace('GoianoMath.', '')));
const extras = [...new Set(runtimeNames)].filter(n => !goianoNamesInTable.has(n));
console.log(`\nnomes definidos no runtime (${new Set(runtimeNames).size}) que não constam em metodosGoianos (${extras.length}): ${extras.join(', ')}`);

// ---- 6) métodos documentados em METODOS_GOIANOS.md que não existem no runtime ----
const doc = fs.readFileSync('<repo>/docs/METODOS_GOIANOS.md', 'utf8');
const docNames = new Set([...doc.matchAll(/\.(\w+)\(/g)].map(m => m[1]).filter(n => /^[a-z_]+$/.test(n) && n.includes('_') || ['mapear', 'filtrar', 'reduzir', 'achar', 'trocar', 'dividir', 'juntar', 'aparar', 'contem', 'tamanho', 'pedaco', 'fatiar', 'empurrar', 'ordenar', 'inverter', 'emendar', 'chaves', 'valores', 'entradas', 'misturar', 'sorteio', 'arredondar', 'maior', 'menor', 'absoluto', 'potencia', 'ordenar'].includes(n)));
const missing = [...docNames].filter(n => !new RegExp(`\\b${n}\\b`).test(RUNTIME));
console.log(`métodos citados no METODOS_GOIANOS.md sem definição no runtime (${missing.length}): ${missing.join(', ') || '-'}`);
