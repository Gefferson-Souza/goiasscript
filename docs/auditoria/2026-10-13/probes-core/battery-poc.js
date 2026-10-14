'use strict';
// Roda a MESMA bateria (cases-*.js) contra a prova de conceito baseada em tokens e compara com a produção (results.json).
const fs = require('fs');
const path = require('path');
const { runJs, runPlainJs, show } = require('./harness');
const poc = require('./proto-transpile');

const FILES = ['cases-1-identifiers.js', 'cases-2-strings-templates.js', 'cases-3-operators-unicode.js', 'cases-4-method-rewrite.js', 'cases-5-runtime-and-misc.js', 'cases-6-extra.js'];
const production = Object.fromEntries(require('./results.json').map(r => [r.id, r]));

async function evaluate(c) {
  const t = poc.transpile(c.gs);
  const r = t.ok
    ? { transpiled: true, warnings: [], user: t.code, run: await runJs(t.code, c.runOpts) }
    : { transpiled: false, transpileError: `${t.error.message} (linha ${t.error.line})`, warnings: [], user: null, run: null };
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
    detalhe = res.detalhe || '';
  } else if (!r.transpiled) {
    ok = false;
    detalhe = `transpile falhou: ${r.transpileError}`;
  } else if (!r.run.ok) {
    ok = false;
    detalhe = `execução falhou: ${r.run.error}`;
  } else {
    ok = r.run.stdout === expected;
    detalhe = ok ? '' : `stdout obtido=${show(r.run.stdout, 160)}`;
  }
  return { ok, detalhe, saida: r.transpiled ? r.user : `(erro) ${r.transpileError}` };
}

(async () => {
  const cases = FILES.flatMap(f => require(path.join(__dirname, f))).filter(c => typeof c.gs === 'string' && !c.custom);
  const skipped = FILES.flatMap(f => require(path.join(__dirname, f))).filter(c => c.custom || typeof c.gs !== 'string').map(c => c.id);
  const rows = [];
  for (const c of cases) {
    let ev;
    try { ev = await evaluate(c); } catch (error) { ev = { ok: false, detalhe: `exceção: ${error.message}`, saida: '' }; }
    rows.push({ id: c.id, grupo: c.grupo, titulo: c.titulo, sev: c.sev, classe: c.classe, prodOk: production[c.id].ok, pocOk: ev.ok, detalhe: ev.detalhe, saida: ev.saida });
  }
  const fixed = rows.filter(r => !r.prodOk && r.pocOk);
  const regressions = rows.filter(r => r.prodOk && !r.pocOk);
  const stillFailing = rows.filter(r => !r.prodOk && !r.pocOk);
  const prodFail = rows.filter(r => !r.prodOk).length;
  console.log(`casos comparáveis=${rows.length} (ignorados por serem custom/API: ${skipped.join(', ')})`);
  console.log(`produção: ${rows.filter(r => r.prodOk).length} ✅ / ${prodFail} ❌ | prova de conceito: ${rows.filter(r => r.pocOk).length} ✅ / ${rows.filter(r => !r.pocOk).length} ❌`);
  console.log(`corrigidos pela PoC: ${fixed.length} de ${prodFail} | regressões (✅ na produção, ❌ na PoC): ${regressions.length} | continuam ❌: ${stillFailing.length}`);
  console.log('\n--- REGRESSÕES ---');
  regressions.forEach(r => console.log(`${r.id} ${r.titulo}\n     saída: ${show(r.saida, 140)}\n     ${show(r.detalhe, 200)}`));
  console.log('\n--- CONTINUAM FALHANDO NA PoC ---');
  stillFailing.forEach(r => console.log(`${r.id} [${r.sev}] ${r.titulo}\n     saída: ${show(r.saida, 140)}\n     ${show(r.detalhe, 200)}`));
  fs.writeFileSync(path.join(__dirname, 'battery-poc.json'), JSON.stringify({ rows, skipped }, null, 2));
})();
