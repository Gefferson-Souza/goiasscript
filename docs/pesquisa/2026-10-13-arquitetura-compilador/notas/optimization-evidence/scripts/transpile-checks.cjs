// Passa trechos pelo transpilador do repo e mostra o que é emitido depois do prelúdio.
const vm = require('node:vm');
const REPO = '<repo>';
const T = require(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`);
const B = require(`${REPO}/packages/core/src/goianoMethods/GoianoBuiltins.js`);
const preludeLen = new B().gerarImplementacaoGoiana().length + 2;
const cases = {
  'array length assignment': 'trem lista = [1, 2, 3];\nlista.length = 0;\nconsole.log(lista);',
  'object with own length property': 'uai o = { length: 3 };\nconsole.log(o.length);',
  'regex literal containing .length': 'uai r = /\\.length\\b/;\nconsole.log(r.source);',
  'user class with own map method': 'arruma_trem Caixa { map(f) { faz_favor "meu map"; } }\nconsole.log(faz_um Caixa().map(x => x));',
  'loop over string length': 'uai s = "goiania";\ntrem n = 0;\nvai_indo (trem i = 0; i < s.length; i++) { n += 1; }\nconsole.log(n);',
};
for (const [name, src] of Object.entries(cases)) {
  const r = new T().transpile(src, 'x.gs');
  console.log(`--- ${name}`);
  if (!r.success) { console.log('  transpile failed:', r.error && r.error.message); continue; }
  const user = r.code.slice(preludeLen).trim();
  console.log('  emitted user part:', JSON.stringify(user));
  try { new vm.Script(r.code); } catch (e) { console.log('  SYNTAX CHECK FAILED:', e.constructor.name + ': ' + e.message); continue; }
  const logs = [];
  try { vm.runInNewContext(r.code, { console: { log: (...a) => logs.push(a.map(String).join(' ')) } }); console.log('  ran OK, console.log ->', JSON.stringify(logs)); }
  catch (e) { console.log('  RUNTIME ERROR:', e.constructor.name + ': ' + e.message); }
}
