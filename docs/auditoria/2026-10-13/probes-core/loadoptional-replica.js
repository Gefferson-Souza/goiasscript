'use strict';
// Réplica EXATA de loadOptional (compiler.js:8-17) aplicada a um módulo opcional PRESENTE cuja dependência interna falta.
// Demonstra que o catch por MODULE_NOT_FOUND engole falhas que não são "o módulo opcional não existe".
const fs = require('fs');
const path = require('path');

function loadOptional(modulePath, fallback) {
  try {
    return require(modulePath);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      return fallback;
    }
    throw err;
  }
}

const dir = fs.mkdtempSync(path.join(__dirname, 'tmp-loadopt-'));
// (diretório temporário dentro do scratchpad das sondagens; removido no fim)
fs.writeFileSync(path.join(dir, 'TypeAnalyzerReal.js'), "const dep = require('pacote-que-nao-existe-xyz');\nmodule.exports = class TypeAnalyzer { analyze() { return { real: true }; } };\n");
fs.writeFileSync(path.join(dir, 'ModuleComErroDeSintaxe.js'), 'module.exports = class { oops( ;\n');
fs.writeFileSync(path.join(dir, 'ModuleOk.js'), 'module.exports = class Ok { analyze() { return { real: true }; } };\n');

const FALLBACK = class Noop { analyze() { return { real: false }; } };

const cases = [
  ['módulo ausente (caso previsto)', './NaoExiste'],
  ['módulo PRESENTE, mas com dependência interna faltando', './TypeAnalyzerReal'],
  ['módulo presente e correto', './ModuleOk'],
];
for (const [label, rel] of cases) {
  const result = loadOptional(path.join(dir, rel), FALLBACK);
  console.log(`${label.padEnd(58)} -> ${result === FALLBACK ? 'FALLBACK (silencioso)' : 'módulo real carregado'}`);
}
try {
  loadOptional(path.join(dir, './ModuleComErroDeSintaxe'), FALLBACK);
} catch (error) {
  console.log(`${'módulo presente com erro de sintaxe'.padEnd(58)} -> propaga ${error.name}`);
}
fs.rmSync(dir, { recursive: true, force: true });
