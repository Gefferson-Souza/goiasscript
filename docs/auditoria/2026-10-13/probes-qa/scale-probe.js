const path = require('path');
const { GoiasScriptBrowserCompiler } = require(path.join(process.argv[2], 'src/browser'));
const c = new GoiasScriptBrowserCompiler();
function time(label, src) {
  const t0 = process.hrtime.bigint();
  const r = c.transpile(src, 'x.gs');
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(label.padEnd(44), ms.toFixed(0).padStart(7) + ' ms  success=' + r.success);
  return ms;
}
// n literais de string legitimos, um por linha: prosa("item i");
for (const n of [2000, 4000, 8000, 16000, 32000]) {
  const src = Array.from({ length: n }, (_, i) => `prosa("item ${i}");`).join('\n');
  time(`${n} literais de string (${(src.length / 1024).toFixed(0)} KiB)`, src);
}
