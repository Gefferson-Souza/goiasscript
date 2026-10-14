'use strict';
// Extrai os blocos ```goiasscript do README.md e de docs/METODOS_GOIANOS.md (somente leitura) e passa cada um pelo pipeline real.
// Etapas: transpile -> checagem de sintaxe do JS gerado (vm.Script) -> execução em sandbox strict (como o CLI) com timeout.
const fs = require('fs');
const vm = require('vm');
const util = require('util');
const { transpile, RUNTIME, show } = require('./harness');

const REPO = '<repo>';
const DOCS = ['README.md', 'docs/METODOS_GOIANOS.md'];

function blocksOf(markdown) {
  const out = [];
  const re = /```goiasscript\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const line = markdown.slice(0, m.index).split('\n').length + 1;
    out.push({ line, code: m[1] });
  }
  return out;
}

function execStrict(js) {
  const out = [];
  const sandbox = vm.createContext({
    console: { log: (...a) => out.push(util.format(...a)), error: (...a) => out.push(util.format(...a)), warn: (...a) => out.push(util.format(...a)) },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  });
  try {
    vm.runInContext(`"use strict";\n${js}`, sandbox, { timeout: 500 });
    return { ok: true, stdout: out.join('\n') };
  } catch (error) {
    return { ok: false, error: `${error.name}: ${error.message}`, stdout: out.join('\n') };
  }
}

const summary = [];
for (const rel of DOCS) {
  const md = fs.readFileSync(`${REPO}/${rel}`, 'utf8');
  const blocks = blocksOf(md);
  console.log(`\n##### ${rel}: ${blocks.length} blocos \`goiasscript\``);
  for (const b of blocks) {
    const t = transpile(b.code);
    const head = show(b.code.split('\n').find(l => l.trim() && !l.trim().startsWith('//')) || '', 70);
    if (!t.success) {
      console.log(`  L${String(b.line).padEnd(4)} TRANSPILE FALHOU  | ${head} | ${show(t.error.message, 100)}`);
      summary.push({ rel, line: b.line, estado: 'transpile-falhou' });
      continue;
    }
    let syntaxError = null;
    try {
      new vm.Script(t.code);
    } catch (error) {
      syntaxError = error.message;
    }
    if (syntaxError) {
      const user = t.code.split('\n').slice(247).join('\n');
      console.log(`  L${String(b.line).padEnd(4)} SINTAXE INVÁLIDA  | ${head} | ${syntaxError}`);
      const culprit = user.split('\n').find(l => /\bse\b|presta|é_|vixe_que|\bé\b/.test(l));
      if (culprit) console.log(`        trecho suspeito no JS gerado: ${show(culprit.trim(), 110)}`);
      summary.push({ rel, line: b.line, estado: 'sintaxe-invalida', motivo: syntaxError });
      continue;
    }
    const r = execStrict(t.code);
    if (r.ok) {
      console.log(`  L${String(b.line).padEnd(4)} ok                | ${head}`);
      summary.push({ rel, line: b.line, estado: 'ok' });
    } else {
      console.log(`  L${String(b.line).padEnd(4)} ERRO EM EXECUÇÃO  | ${head} | ${show(r.error, 110)}`);
      summary.push({ rel, line: b.line, estado: 'erro-execucao', motivo: r.error });
    }
  }
}
const by = summary.reduce((acc, s) => ({ ...acc, [s.estado]: (acc[s.estado] || 0) + 1 }), {});
console.log(`\nRESUMO: ${summary.length} blocos | ${JSON.stringify(by)}`);
fs.writeFileSync(`${__dirname}/docs-blocks.json`, JSON.stringify(summary, null, 2));
