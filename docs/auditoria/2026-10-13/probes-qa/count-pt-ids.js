// Conta ocorrências de identificadores portugueses FORA de strings e comentários.
const fs = require('fs');
const root = process.argv[2];
const files = [
  'packages/core/tests/setup.js',
  'packages/core/tests/unit/cli.test.js',
  'packages/core/tests/unit/compiler.test.js',
  'packages/core/tests/unit/errors.test.js',
  'packages/core/tests/unit/goianoBuiltins.test.js',
  'packages/core/tests/unit/lexer.test.js',
  'apps/engoianador-api/test/cors.test.ts',
  'apps/engoianador-api/test/prompt.test.ts',
  'apps/engoianador-api/test/rate-limit.test.ts',
  'apps/engoianador-api/test/helpers.ts',
  'apps/playground-e2e/tests/home.spec.ts',
  'apps/playground-e2e/tests/examples.spec.ts',
  'apps/playground-e2e/tests/security.spec.ts',
  'apps/playground-e2e/tests/engoianador.spec.ts',
  'apps/playground-e2e/tests/doacao.spec.ts',
];
const words = [
  'codigo', 'resultado', 'erro', 'erroOriginal', 'casos', 'detalhes', 'metodos', 'metodosProibidos',
  'exemplo', 'otimizado', 'tipos', 'abre', 'fecha', 'malicioso', 'quarta', 'carregarExemplo',
  'marcador', 'chamou', 'esperado', 'tipo',
];
function strip(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}
const total = {};
const perFile = {};
for (const f of files) {
  const clean = strip(fs.readFileSync(`${root}/${f}`, 'utf8'));
  for (const w of words) {
    // identificador isolado, não precedido de ponto (evita propriedades de API como erro.tipo)
    const re = new RegExp(`(?<![.\\w$])${w}(?![\\w$])`, 'g');
    const n = (clean.match(re) || []).length;
    if (n) {
      total[w] = (total[w] || 0) + n;
      perFile[f] = (perFile[f] || 0) + n;
    }
  }
}
console.log(JSON.stringify(total));
console.log(JSON.stringify(perFile, null, 1));
console.log('SOMA', Object.values(total).reduce((a, b) => a + b, 0));
