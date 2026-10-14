'use strict';
// Runner da bateria adversarial do transpilador. Uso: node battery.js [filtro-de-id-ou-grupo]
// Cada caso: { id, grupo, titulo, gs, esperado | expectFromPlainJs | check | custom, sev, classe, nota }
//  - esperado: stdout esperado do programa (a semântica pretendida do GoiásScript)
//  - expectFromPlainJs: o próprio `gs` é JS puro; esperado = stdout do mesmo código executado sem transpilar
//  - check(r): função (r = resultado de runGs) -> { ok, detalhe }
//  - custom(): função assíncrona -> { ok, detalhe, entrada, saida }  (para casos fora do pipeline padrão)
const fs = require('fs');
const path = require('path');
const { runGs, runPlainJs, show } = require('./harness');

const FILES = [
  'cases-1-identifiers.js',
  'cases-2-strings-templates.js',
  'cases-3-operators-unicode.js',
  'cases-4-method-rewrite.js',
  'cases-5-runtime-and-misc.js',
  'cases-6-extra.js',
];

const filter = process.argv[2];

async function evaluate(c) {
  if (c.custom) {
    const r = await c.custom();
    return { entrada: r.entrada ?? c.gs ?? '(custom)', saida: r.saida ?? '', avisos: r.avisos ?? [], exec: r.exec ?? '', ok: r.ok, detalhe: r.detalhe ?? '' };
  }
  const r = await runGs(c.gs, c.runOpts);
  let expected = c.esperado;
  if (c.expectFromPlainJs) {
    const plain = await runPlainJs(c.gs, c.runOpts);
    expected = plain.ok ? plain.stdout : `(JS puro falhou: ${plain.error})`;
  }
  let ok;
  let detalhe = '';
  if (c.check) {
    const res = c.check(r);
    ok = res.ok;
    detalhe = res.detalhe ?? '';
  } else if (!r.transpiled) {
    ok = false;
    detalhe = `transpile falhou: ${r.transpileError}`;
  } else if (!r.run.ok) {
    ok = false;
    detalhe = `execução falhou: ${r.run.error}`;
  } else {
    ok = r.run.stdout === expected;
    detalhe = ok ? '' : `stdout obtido=${show(r.run.stdout, 300)}`;
  }
  return {
    entrada: c.gs,
    saida: r.transpiled ? r.user : '(sem saída: transpile falhou)',
    avisos: r.transpiled ? r.warnings : [],
    exec: !r.transpiled ? '' : r.run.ok ? `ok -> ${show(r.run.stdout, 300)}` : `ERRO ${r.run.error} | stdout parcial=${show(r.run.stdout, 200)}`,
    esperado: expected,
    ok,
    detalhe,
  };
}

(async () => {
  const cases = FILES.flatMap(f => require(path.join(__dirname, f)));
  const results = [];
  for (const c of cases) {
    if (filter && !(c.id.startsWith(filter) || c.grupo === filter)) continue;
    let ev;
    try {
      ev = await evaluate(c);
    } catch (error) {
      ev = { entrada: c.gs, saida: '', avisos: [], exec: '', ok: false, detalhe: `exceção no runner: ${error.stack}` };
    }
    results.push({ id: c.id, grupo: c.grupo, titulo: c.titulo, sev: c.sev ?? '-', classe: c.classe ?? '', nota: c.nota ?? '', ...ev });
  }

  const lines = [];
  for (const r of results) {
    lines.push(`[${r.ok ? 'OK ' : 'FALHA'}] ${r.id} (${r.grupo}) ${r.titulo}${r.ok ? '' : `  sev=${r.sev}`}`);
    lines.push(`    entrada : ${show(r.entrada, 300)}`);
    lines.push(`    saida   : ${show(r.saida, 300)}`);
    if (r.avisos && r.avisos.length) lines.push(`    avisos  : ${r.avisos.map(a => show(a, 140)).join(' || ')}`);
    if (r.esperado !== undefined) lines.push(`    esperado: ${show(r.esperado, 300)}`);
    lines.push(`    exec    : ${r.exec}`);
    if (r.detalhe) lines.push(`    detalhe : ${show(r.detalhe, 400)}`);
  }
  const pass = results.filter(r => r.ok).length;
  const failBySev = results.filter(r => !r.ok).reduce((acc, r) => ({ ...acc, [r.sev]: (acc[r.sev] ?? 0) + 1 }), {});
  lines.push('');
  lines.push(`TOTAL ${results.length} | OK ${pass} | FALHA ${results.length - pass} | por severidade: ${JSON.stringify(failBySev)}`);

  const outDir = __dirname;
  fs.writeFileSync(path.join(outDir, filter ? `results-${filter}.txt` : 'results.txt'), lines.join('\n'));
  fs.writeFileSync(path.join(outDir, filter ? `results-${filter}.json` : 'results.json'), JSON.stringify(results, null, 2));
  console.log(lines.join('\n'));
})();
