'use strict';
// Prova de conceito para a recomendação "apontar de volta ao .gs": vm.Script aceita filename e lineOffset.
// Se o transpilador preservasse a contagem de linhas, o stack do V8 já apontaria para o .gs.
const vm = require('vm');
const { transpile, show } = require('./harness');

const OFFSET = 247;
const gs = ['uai a é 1;', 'prosa(a);', 'prosa(naoExiste);', 'prosa("nunca chega");'].join('\n');
const t = transpile(gs);

function stackLine(runner) {
  try {
    runner();
    return '(sem erro)';
  } catch (error) {
    return (error.stack || '').split('\n').slice(0, 2).map(l => l.trim()).join(' | ');
  }
}

const sandbox = () => vm.createContext({ console: { log() {}, error() {}, warn() {} }, setTimeout, clearTimeout });

console.log('1) vm.Script SEM lineOffset (como hoje): ');
console.log('   ', show(stackLine(() => new vm.Script(t.code, { filename: 'prog.gs' }).runInContext(sandbox())), 220));
console.log('2) vm.Script COM filename=prog.gs e lineOffset=-247: ');
console.log('   ', show(stackLine(() => new vm.Script(t.code, { filename: 'prog.gs', lineOffset: -OFFSET }).runInContext(sandbox())), 220));

console.log('3) SyntaxError (JS inválido) com lineOffset: ');
const bad = transpile(['uai a é 1;', 'uai x é (;', 'prosa(a);'].join('\n'));
console.log('   ', show(stackLine(() => new vm.Script(bad.code, { filename: 'prog.gs', lineOffset: -OFFSET })), 220));

console.log('4) com transpile que muda a contagem de linhas (é no fim da linha) o offset deixa de valer: ');
const shifted = transpile(['trem x;', 'x é', '  5;', 'prosa(naoExiste);'].join('\n'));
console.log('    .gs tem o erro na linha 4; ');
console.log('   ', show(stackLine(() => new vm.Script(shifted.code, { filename: 'prog.gs', lineOffset: -OFFSET }).runInContext(sandbox())), 220));
