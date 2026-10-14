// Verifica se o código gerado roda em modo strict em cada hospedeiro: CLI execute(), arquivo emitido e Function com "use strict".
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const REPO = '<repo>';
const Compiler = require(`${REPO}/packages/core/src/compiler.js`);
const Transpiler = require(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`);
const probe = 'String.prototype.tipo = function() { return typeof this; };\nuai t = "abc".tipo();\nprosa("typeof this:", t);';
const generated = new Transpiler().transpile(probe, 'x.gs').code;
console.log('--- CLI execute(): eval direto dentro de método de classe');
new Compiler({ enableJIT: false }).execute(probe, 'x.gs');
const emitted = path.join(os.tmpdir(), 'goias-emitted-check.js');
fs.writeFileSync(emitted, generated);
console.log('--- arquivo emitido, executado com node puro (CommonJS)');
process.stdout.write(execFileSync(process.execPath, [emitted]).toString());
console.log('--- new Function com "use strict" (caminho do playground)');
new Function('console', '"use strict"; ' + generated)(console);
