'use strict';
// Sondagens de GoiasScriptCompiler.execute() (compiler.js:281-313): colisão de nomes com o eval direto,
// poluição do processo hospedeiro e erros assíncronos. Cada cenário roda em processo-filho próprio.
const { execFileSync } = require('child_process');
const path = require('path');

const COMPILER = '<repo>/packages/core/src/compiler';

function child(label, body) {
  const script = `
    const C = require(${JSON.stringify(COMPILER)});
    const c = new C();
    ${body}
  `;
  try {
    const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(`[${label}]\n${out.trim().split('\n').map(l => '    ' + l).join('\n')}`);
  } catch (error) {
    const stderr = (error.stderr || '').toString().trim().split('\n').slice(0, 6).map(l => '    ' + l).join('\n');
    console.log(`[${label}] SAIU COM CÓDIGO ${error.status}\n    stdout: ${(error.stdout || '').toString().trim()}\n${stderr}`);
  }
}

console.log('=== 1) Colisão de nomes com as variáveis locais de execute() (eval direto) ===');
for (const name of ['result', 'compileResult', 'code', 'fileName', 'error', 'arguments']) {
  child(`trem ${name}`, `
    const r = c.execute('trem ${name} é 7; prosa("valor:", ${name});', 'x.gs');
    console.log('success=' + r.success + (r.error ? ' erro=' + r.error.message : ''));
  `);
}
child('uai result (const)', `
  const r = c.execute('uai result é 7; prosa("valor:", result);', 'x.gs');
  console.log('success=' + r.success + (r.error ? ' erro=' + r.error.message : ''));
`);
child('faz_trem result()', `
  const r = c.execute('faz_trem result() { faz_favor 1; } prosa("valor:", result());', 'x.gs');
  console.log('success=' + r.success + (r.error ? ' erro=' + r.error.message : ''));
`);

console.log('\n=== 2) Poluição do processo hospedeiro após execute() ===');
child('antes/depois de execute()', `
  const keysBefore = []; for (const k in {}) keysBefore.push(k);
  const arrBefore = []; for (const k in [1]) arrBefore.push(k);
  const r = c.execute('prosa("oi");', 'x.gs');
  const keysAfter = []; for (const k in {}) keysAfter.push(k);
  const arrAfter = []; for (const k in [1]) arrAfter.push(k);
  console.log('for..in em {}  antes=' + JSON.stringify(keysBefore) + ' depois=' + JSON.stringify(keysAfter));
  console.log('for..in em [1] antes=' + arrBefore.length + ' chaves, depois=' + arrAfter.length + ' chaves');
  console.log('typeof Array.prototype.mapear=' + typeof Array.prototype.mapear + ' | typeof globalThis.prosa=' + typeof globalThis.prosa);
  console.log('success=' + r.success);
`);
child('libs que usam for..in sem guarda (Object.assign de terceiros)', `
  c.execute('prosa(1);', 'x.gs');
  // padrão comum em código legado/de terceiros: copiar propriedades com for..in sem hasOwnProperty
  function legacyExtend(dst, src) { for (const k in src) dst[k] = src[k]; return dst; }
  const merged = legacyExtend({}, { a: 1 });
  console.log('legacyExtend({}, {a:1}) -> ' + JSON.stringify(Object.keys(merged)) + ' (esperado: ["a"])');
  const o = JSON.parse('{"x":1}');
  console.log('typeof o.tem_propriedade (todo objeto JSON agora tem) = ' + typeof o.tem_propriedade);
`);

console.log('\n=== 3) execute(): erros assíncronos não são capturados ===');
child('rejeição não tratada', `
  const r = c.execute('vai_na_frente_faz_trem f() { vixe("boom async"); } f(); prosa("depois do f()");', 'x.gs');
  console.log('execute() retornou success=' + r.success + ' (antes da rejeição ocorrer)');
`);
child('exceção dentro de setTimeout', `
  const r = c.execute('setTimeout(() => { vixe("boom timer"); }, 1); prosa("agendado");', 'x.gs');
  console.log('execute() retornou success=' + r.success);
`);

console.log('\n=== 4) execute(): valor de retorno e estado entre chamadas ===');
child('valor de conclusão do eval', `
  const r1 = c.execute('uai a é 41; a mais 1;', 'x.gs');
  const r2 = c.execute('prosa("sem valor");', 'x.gs');
  console.log('output(1)=' + JSON.stringify(r1.output) + ' output(2)=' + JSON.stringify(r2.output));
`);
child('chamar execute() 2x com declarações top-level', `
  const a = c.execute('uai x é 1; prosa("1ª", x);', 'x.gs');
  const b = c.execute('uai x é 2; prosa("2ª", x);', 'x.gs');
  console.log('1ª success=' + a.success + ' | 2ª success=' + b.success + (b.error ? ' erro=' + b.error.message : ''));
`);

console.log('\n=== 5) compile(): resultado, campos e custo de módulos opcionais ===');
child('forma do resultado e módulos opcionais', `
  const r = c.compile('uai x é 1;', 'x.gs');
  console.log('chaves do resultado: ' + Object.keys(r).join(', '));
  console.log('typeInfo=' + JSON.stringify(r.typeInfo) + ' moduleInfo=' + JSON.stringify(r.moduleInfo));
  console.log('transpiler.options usado? ' + JSON.stringify(c.transpiler.options));
  const withOpts = new C({ debug: true, sourceMap: true });
  const r2 = withOpts.compile('uai x é 1;', 'x.gs');
  console.log('com {debug,sourceMap}: mesmas chaves? ' + (Object.keys(r2).join() === Object.keys(r).join()) + ' | tem sourceMap? ' + ('sourceMap' in r2));
  console.log('métodos mortos retornam: getJITReport=' + JSON.stringify(c.getJITReport()) + ' getJITHotSpots=' + JSON.stringify(c.getJITHotSpots()) + ' getModuleDependencyReport=' + JSON.stringify(c.getModuleDependencyReport()));
`);
child('transpile() do compilador vs transpile() do browser: formas diferentes', `
  const B = require(${JSON.stringify(path.join(path.dirname(COMPILER), 'browser'))}).GoiasScriptBrowserCompiler;
  const a = c.transpile('uai x é 1;', 'x.gs');
  const b = new B().transpile('uai x é 1;', 'x.gs');
  console.log('compiler.transpile -> chaves: ' + Object.keys(a).join(', '));
  console.log('browser.transpile  -> chaves: ' + Object.keys(b).join(', '));
`);
