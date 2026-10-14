// Probe: cada .gs enviado no pacote transpila, gera JS com sintaxe válida e executa?
// Execução em vm com console/timers stubados e timeout (nada toca o repo).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const core = process.argv[2];
const GoiasScriptCompiler = require(path.join(core, 'src/compiler'));

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      walk(p);
    } else if (e.name.endsWith('.gs')) files.push(p);
  }
})(core);
files.sort();

const rows = [];
for (const f of files) {
  const rel = path.relative(core, f);
  const src = fs.readFileSync(f, 'utf8');
  const compiler = new GoiasScriptCompiler();
  let compile = 'ok';
  let syntax = '-';
  let exec = '-';
  let detail = '';
  const res = compiler.compile(src, rel);
  if (!res.success) {
    compile = 'FALHOU';
    detail = (res.errors[0] && res.errors[0].message) || 'sem mensagem';
  } else {
    try {
      new vm.Script(res.javascript, { filename: rel });
      syntax = 'ok';
    } catch (e) {
      syntax = 'INVALIDA';
      detail = `${e.name}: ${e.message}`;
    }
    if (syntax === 'ok') {
      const out = [];
      const ctx = vm.createContext({
        console: {
          log: (...a) => out.push(a.join(' ')),
          error: (...a) => out.push('ERR ' + a.join(' ')),
          warn: (...a) => out.push('WARN ' + a.join(' ')),
        },
        setTimeout,
        clearTimeout,
        Promise,
      });
      try {
        vm.runInContext(res.javascript, ctx, { timeout: 3000 });
        exec = 'ok';
        detail = `${out.length} linhas de saida`;
      } catch (e) {
        exec = 'ERRO';
        detail = `${e.name}: ${e.message}`;
      }
    }
  }
  rows.push({ rel, compile, syntax, exec, detail });
}
for (const r of rows) {
  console.log(`${r.rel.padEnd(46)} compile=${r.compile.padEnd(6)} sintaxeJS=${r.syntax.padEnd(8)} exec=${r.exec.padEnd(5)} ${r.detail.slice(0, 110)}`);
}
const bad = rows.filter(r => r.compile !== 'ok' || r.syntax === 'INVALIDA' || r.exec === 'ERRO');
console.log(`\nTOTAL=${rows.length} problematicos=${bad.length}`);
