// Gera input-full.js (prelúdio + usuário) e input-user.js (só o código do usuário) ao lado deste script.
const fs = require('node:fs');
const path = require('node:path');
const REPO = '<repo>';
const Transpiler = require(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`);
const Builtins = require(`${REPO}/packages/core/src/goianoMethods/GoianoBuiltins.js`);
const prelude = new Builtins().gerarImplementacaoGoiana();
const source = fs.readFileSync(`${REPO}/packages/core/examples/basic/lista-mapeamento.gs`, 'utf8');
const result = new Transpiler().transpile(source, 'lista-mapeamento.gs');
if (!result.success) throw new Error('transpilação falhou');
fs.writeFileSync(path.join(__dirname, 'input-full.js'), result.code);
fs.writeFileSync(path.join(__dirname, 'input-user.js'), result.code.slice(prelude.length + 2));
console.log('prelude bytes:', Buffer.byteLength(prelude), '| full bytes:', Buffer.byteLength(result.code));
