const path = require('path');
const vm = require('vm');
const core = process.argv[2];
const { GoiasScriptBrowserCompiler } = require(path.join(core, 'src/browser'));
const GoianoBuiltins = require(path.join(core, 'src/goianoMethods/GoianoBuiltins'));
const runtime = new GoianoBuiltins().gerarImplementacaoGoiana();
const c = new GoiasScriptBrowserCompiler();
const cut = js => js.slice((runtime + '\n\n').length);
const cases = [
  'trem i é 0;\nenquanto_tiver (certeza) { i é i mais 1; se_ocê_quiser (i pelo_menos 3) { para_com_isso; } }\nprosa(i);',
  'trem i é 0;\nenquanto_tiver (certeza) { i é i mais 1; se_ocê_quiser (i pelo_menos 3) { para_com_isso } }\nprosa(i);',
  'trem i é 0;\nenquanto_tiver (i menor_que 5) { i é i mais 1; se_ocê_quiser (i é_igualim 2) { continua_aí; } prosa(i); }',
  'faz_trem f(x) { se_ocê_quiser (x) { faz_favor; } faz_favor 1; }\nprosa(f(0));',
  'faz_trem f() { tenta_aí { vixe("xi"); } se_der_ruim (e) { faz_favor e.message; } }\nprosa(f());',
  'uai r é /mais|menos/;\nprosa(r.test("mais"));',
];
for (const src of cases) {
  const r = c.transpile(src, 'p.gs');
  const js = r.success ? cut(r.code) : '(falhou)';
  let state = 'parse ok';
  try { new vm.Script(r.code); } catch (e) { state = 'PARSE INVALIDO: ' + e.message; }
  let exec = '';
  if (state === 'parse ok') {
    const out = [];
    const ctx = vm.createContext({ console: { log: (...a) => out.push(a.join(' ')), error: () => {}, warn: () => {} } });
    try { vm.runInContext(r.code, ctx, { timeout: 1500 }); exec = 'exec ok ' + JSON.stringify(out); } catch (e) { exec = 'exec ERRO ' + e.name + ': ' + e.message; }
  }
  console.log('GS : ' + JSON.stringify(src));
  console.log('JS : ' + JSON.stringify(js));
  console.log('=> ' + state + ' ' + exec + '\n');
}
