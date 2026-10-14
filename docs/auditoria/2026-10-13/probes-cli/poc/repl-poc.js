'use strict';
// PoC (fora do repo): REPL goiano sobre node:repl + vm reaproveitando o compilador do core.
const repl = require('node:repl');
const vm = require('node:vm');
const Compiler = require(process.env.CORE + '/src/compiler');
const Builtins = require(process.env.CORE + '/src/goianoMethods/GoianoBuiltins');

const compiler = new Compiler();
const runtime = new Builtins().gerarImplementacaoGoiana();
const sandbox = vm.createContext({ console, setTimeout, setInterval, clearTimeout, clearInterval });
vm.runInContext(runtime, sandbox);

const stripRuntime = js => js.slice(js.indexOf(runtime) + runtime.length).trimStart();

function evalGoiano(command, _ctx, _file, done) {
  if (!command.trim()) return done(null);
  const compiled = compiler.compile(command, 'repl.gs');
  if (!compiled.success) return done(new Error(compiled.errors[0].message));
  const js = stripRuntime(compiled.javascript);
  try {
    new vm.Script(js);
  } catch (error) {
    if (/Unexpected end of input|Unterminated|missing \)/.test(error.message)) return done(new repl.Recoverable(error));
    return done(error);
  }
  try {
    return done(null, vm.runInContext(js, sandbox));
  } catch (error) {
    return done(error);
  }
}

const server = repl.start({ prompt: 'goiás> ', eval: evalGoiano, useGlobal: false, ignoreUndefined: true });
server.defineCommand('desenrola', { help: 'Desenrola esse trem (ajuda)', action() { console.log('ajuda goiana'); this.displayPrompt(); } });
server.defineCommand('vaza', { help: 'Vaza daqui', action() { this.close(); } });
