'use strict';
// Uso: node t.js '<codigo .gs>'  -> imprime saída transpilada (sem runtime), avisos e resultado da execução.
const { runGs, show } = require('./harness');

(async () => {
  const gs = process.argv[2] !== undefined ? process.argv[2] : '';
  const r = await runGs(gs);
  console.log('ENTRADA :', show(gs, 600));
  if (!r.transpiled) {
    console.log('TRANSPILE: ERRO ->', r.transpileError);
    return;
  }
  console.log('SAIDA JS:', show(r.user, 600));
  console.log('AVISOS  :', r.warnings.length ? r.warnings.map(w => show(w, 160)) : '(nenhum)');
  console.log('EXEC    :', r.run.ok ? `ok stdout=${show(r.run.stdout)}` : `FALHOU ${r.run.error} | stdout=${show(r.run.stdout)}`);
})();
