// Extrai identificadores declarados (variáveis, funções, parâmetros de arrow) nos arquivos de teste
// e marca os que parecem portugueses por um dicionário de radicais comuns.
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

// radicais/palavras portuguesas que aparecem como identificadores
const PT = new Set(
  (
    'codigo resultado erro erroOriginal esperado casos detalhes metodos metodosProibidos tipos tipo ' +
    'exemplo otimizado abre fecha quarta malicioso carregarExemplo marcador chamou doc ' +
    'texto linha coluna arquivo dica mensagem nome idade funcao variavel'
  ).split(/\s+/)
);

function stripNoise(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

const declRe =
  /\b(?:const|let|var)\s+(?:\{([^}]*)\}|\[([^\]]*)\]|([A-Za-z_$][\w$]*))|\bfunction\s+([A-Za-z_$][\w$]*)|\(([A-Za-z_$][\w$,\s:]*)\)\s*=>|\b([A-Za-z_$][\w$]*)\s*=>/g;

const out = {};
for (const f of files) {
  const clean = stripNoise(fs.readFileSync(`${root}/${f}`, 'utf8'));
  const set = new Set();
  let m;
  while ((m = declRe.exec(clean))) {
    const raw = [m[1], m[2], m[3], m[4], m[5], m[6]].filter(Boolean).join(',');
    raw
      .split(/[,\s:]+/)
      .filter(x => /^[A-Za-z_$][\w$]*$/.test(x))
      .forEach(x => set.add(x));
  }
  out[f] = [...set].sort();
}
for (const [f, ids] of Object.entries(out)) {
  const pt = ids.filter(i => PT.has(i));
  console.log(`${f}\n   declarados(${ids.length}): ${ids.join(' ')}\n   pt-suspeitos(${pt.length}): ${pt.join(' ')}`);
}
