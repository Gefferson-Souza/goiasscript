// Mede bytes, gzip e brotli do output real e a linha onde começa o código do usuário.
const fs = require('node:fs');
const zlib = require('node:zlib');
const REPO = '<repo>';
const Transpiler = require(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`);
const Builtins = require(`${REPO}/packages/core/src/goianoMethods/GoianoBuiltins.js`);
const prelude = new Builtins().gerarImplementacaoGoiana();
const source = fs.readFileSync(`${REPO}/packages/core/examples/basic/lista-mapeamento.gs`, 'utf8');
const { code } = new Transpiler().transpile(source, 'lista-mapeamento.gs');
const user = code.slice(prelude.length + 2);
const gz = (s) => zlib.gzipSync(s, { level: 9 }).length;
const br = (s) => zlib.brotliCompressSync(s, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
console.log('trecho    bytes  gzip9  brotli11');
console.log('full    ', Buffer.byteLength(code), gz(code), br(code));
console.log('prelude ', Buffer.byteLength(prelude), gz(prelude), br(prelude));
console.log('user    ', Buffer.byteLength(user), gz(user), br(user));
const firstUserLine = user.split('\n').find((l) => l.trim());
console.log('primeira linha do usuário na saída:', code.split('\n').indexOf(firstUserLine) + 1, 'de', code.split('\n').length);
console.log('prelúdio / total (bytes):', ((Buffer.byteLength(prelude) / Buffer.byteLength(code)) * 100).toFixed(1) + '%');
