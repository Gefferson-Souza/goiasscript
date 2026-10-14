// Uso: node examples-syntax-check.cjs (a partir de qualquer pasta)
// Assume o repositório em <repo>;
// ajuste REPO abaixo se ele estiver em outro lugar.
// Verifica quantos .gs do repositório viram JavaScript sintaticamente válido com o transpilador atual (sem executar nada).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const REPO = '<repo>';
const Transpiler = require(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.name === 'node_modules' || e.name === '.git' || e.name === 'archive') return [];
  return e.isDirectory() ? walk(p) : p.endsWith('.gs') ? [p] : [];
});

const files = walk(REPO);
let ok = 0;
const rows = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let status;
  try {
    const r = new Transpiler().transpile(src, path.basename(f));
    if (!r.success) status = 'TRANSPILE-FAIL: ' + (r.error && r.error.message || '').split('\n')[0];
    else { new vm.Script(r.code); status = 'OK'; ok++; }
  } catch (e) { status = 'INVALID-JS: ' + e.constructor.name + ': ' + e.message; }
  rows.push([path.relative(REPO, f), status]);
}
for (const [f, s] of rows) console.log(s.startsWith('OK') ? 'OK  ' : 'FAIL', f, s.startsWith('OK') ? '' : '=> ' + s);
console.log(`\n${ok} de ${files.length} arquivos .gs geram JavaScript sintaticamente válido`);
