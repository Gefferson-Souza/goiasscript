'use strict';
// Confronta os valores prometidos em comentários `// valor` dos blocos goiasscript da documentação com a execução real.
// Cada linha "<expr>   // <valor literal>" (sem indentação) vira __check(n, () => (<expr>)); o bloco roda em sandbox strict
// com variáveis de contexto pré-definidas (as docs usam fragmentos que dependem de blocos anteriores).
const fs = require('fs');
const vm = require('vm');
const { transpile, userPart, RUNTIME, show } = require('./harness');

const REPO = '<repo>';
const DOCS = ['README.md', 'docs/METODOS_GOIANOS.md'];

function parseExpected(raw) {
  let text = raw.trim().replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return { ok: true, value: Number(text) };
  if (/^"(.*)"$/.test(text)) return { ok: true, value: text.slice(1, -1) };
  if (text === 'certeza') return { ok: true, value: true };
  if (text === 'de_jeito_nenhum') return { ok: true, value: false };
  if (/^\[.*\]$/.test(text)) {
    try { return { ok: true, value: JSON.parse(text) }; } catch { return { ok: false }; }
  }
  return { ok: false };
}

const rows = [];
for (const rel of DOCS) {
  const md = fs.readFileSync(`${REPO}/${rel}`, 'utf8');
  for (const m of md.matchAll(/```goiasscript\n([\s\S]*?)```/g)) {
    const blockLine = md.slice(0, m.index).split('\n').length + 1;
    const checks = [];
    const instrumented = m[1].split('\n').map((line, i) => {
      const hit = /^([^\s/][^/]*?)\s+\/\/\s*(.+)$/.exec(line);
      if (!hit || /^(uai|trem|faz_trem|se_|vai_|\}|\{)/.test(hit[1].trim())) return line;
      const expected = parseExpected(hit[2]);
      if (!expected.ok) return line;
      const expr = hit[1].trim().replace(/;$/, '');
      checks.push({ id: checks.length, expr, expected: expected.value, docLine: blockLine + i, raw: hit[2].trim() });
      return `__check(${checks.length - 1}, () => (${expr}))`;
    }).join('\n');
    if (!checks.length) continue;

    const t = transpile(instrumented);
    if (!t.success) { checks.forEach(c => rows.push({ rel, ...c, estado: 'transpile-falhou' })); continue; }
    const results = {};
    const sandbox = vm.createContext({
      console: { log() {}, error() {}, warn() {} },
      setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
      __check: (id, fn) => {
        try { results[id] = { value: fn() }; } catch (error) { results[id] = { error: `${error.name}: ${error.message}` }; }
      },
    });
    // runtime -> contexto declarado no MESMO realm (arrays herdam os protótipos goianos) -> bloco em IIFE (const do bloco não colide)
    const prelude = 'var nome = "João da Silva"; var numeros = [1, 2, 3, 4, 5]; var idade = 20; var timerId = 1; var numero = 3.7;';
    const script = `"use strict";\n${RUNTIME}\n${prelude}\n(function () {\n${userPart(t.code)}\n})();`;
    let blockError = null;
    try { vm.runInContext(script, sandbox, { timeout: 500 }); } catch (error) { blockError = `${error.name}: ${error.message}`; }
    for (const c of checks) {
      const r = results[c.id];
      if (!r) { rows.push({ rel, ...c, estado: 'nao-executou', detalhe: blockError || 'bloco abortou antes' }); continue; }
      if (r.error) { rows.push({ rel, ...c, estado: 'erro', detalhe: r.error }); continue; }
      if (/\.pegar_(ano|mes|dia|horas|minutos|segundos)\(/.test(c.expr)) { rows.push({ rel, ...c, estado: 'dependente-de-data' }); continue; }
      const same = JSON.stringify(r.value) === JSON.stringify(c.expected);
      rows.push({ rel, ...c, estado: same ? 'confere' : 'DIVERGE', detalhe: same ? '' : `obtido=${JSON.stringify(r.value)}` });
    }
  }
}

for (const r of rows) {
  const flag = r.estado === 'confere' ? 'ok      ' : r.estado.toUpperCase().padEnd(8);
  console.log(`${flag} ${r.rel}:${r.docLine}  ${show(r.expr, 55).padEnd(55)} doc=${show(r.raw, 40)} ${r.detalhe ? '| ' + show(r.detalhe, 90) : ''}`);
}
const by = rows.reduce((acc, r) => ({ ...acc, [r.estado]: (acc[r.estado] || 0) + 1 }), {});
console.log(`\nRESUMO: ${rows.length} valores documentados verificáveis | ${JSON.stringify(by)}`);
