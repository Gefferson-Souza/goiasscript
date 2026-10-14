'use strict';
// Roda TODOS os .gs versionados no repositório pelo pipeline real (transpile + execução em vm isolado).
// Somente leitura: lê os arquivos do repo, não escreve nada nele.
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
const { runGs, show } = require('./harness');

const REPO = '<repo>';

(async () => {
  const files = execFileSync('git', ['-C', REPO, 'ls-files', '*.gs'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const rows = [];
  for (const rel of files) {
    const source = fs.readFileSync(path.join(REPO, rel), 'utf8');
    const r = await runGs(source, { timeoutMs: 4000, settleMs: 3500, maxLines: 60 });
    rows.push({
      arquivo: rel,
      linhas: source.split('\n').length,
      transpile: r.transpiled ? 'ok' : `FALHOU: ${show(r.transpileError, 120)}`,
      avisos: r.transpiled ? r.warnings.length : '-',
      execucao: !r.transpiled ? '-' : r.run.ok ? `ok (${r.run.stdout.split('\n').length} linhas de saída)` : `ERRO ${show(r.run.error, 140)}`,
      primeirasLinhas: !r.transpiled ? '' : show(r.run.stdout, 160),
    });
  }
  for (const row of rows) {
    console.log(`${row.arquivo}  [${row.linhas} linhas]`);
    console.log(`   transpile: ${row.transpile} | avisos: ${row.avisos}`);
    console.log(`   execução : ${row.execucao}`);
    if (row.primeirasLinhas) console.log(`   saída    : ${row.primeirasLinhas}`);
  }
  const ok = rows.filter(r => r.transpile === 'ok' && r.execucao.startsWith('ok')).length;
  console.log(`\nResumo: ${ok}/${rows.length} arquivos .gs transpilam E executam sem erro.`);
  fs.writeFileSync(path.join(__dirname, 'repo-gs-files.json'), JSON.stringify(rows, null, 2));
})();
