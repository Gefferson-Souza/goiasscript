'use strict';
const path = require('path');
const vm = require('vm');

const repo = '<repo>';
const { GoiasScriptBrowserCompiler } = require(path.join(repo, 'packages/core/src/browser.js'));
const GoianoBuiltins = require(path.join(repo, 'packages/core/src/goianoMethods/GoianoBuiltins.js'));

const runtimeLength = new GoianoBuiltins().gerarImplementacaoGoiana().length + 2;
const compiler = new GoiasScriptBrowserCompiler();

function probe(source) {
  const outcome = { source, transpiled: false, userJs: null, warnings: [], syntaxOk: null, runOk: null, output: [], error: null };
  let result;
  try {
    result = compiler.transpile(source, 'probe.gs');
  } catch (err) {
    outcome.error = `transpile lançou: ${err.message}`;
    return outcome;
  }
  if (!result.success) {
    outcome.error = `transpile falhou: ${result.error && result.error.message ? result.error.message : JSON.stringify(result.error)}`;
    return outcome;
  }
  outcome.transpiled = true;
  outcome.warnings = (result.warnings || []).map(w => w.message);
  outcome.userJs = result.code.slice(runtimeLength);
  try {
    new vm.Script(result.code, { filename: 'probe.js' });
    outcome.syntaxOk = true;
  } catch (err) {
    outcome.syntaxOk = false;
    outcome.error = `SyntaxError: ${err.message}`;
    return outcome;
  }
  const sandbox = {
    console: {
      log: (...args) => outcome.output.push(args.map(String).join(' ')),
      error: (...args) => outcome.output.push('[err] ' + args.map(String).join(' ')),
      warn: (...args) => outcome.output.push('[warn] ' + args.map(String).join(' ')),
    },
    setTimeout: () => 0,
    clearTimeout: () => undefined,
    setInterval: () => 0,
    clearInterval: () => undefined,
  };
  try {
    vm.runInNewContext(result.code, sandbox, { timeout: 2000 });
    outcome.runOk = true;
  } catch (err) {
    outcome.runOk = false;
    outcome.error = `${err.name}: ${err.message}`;
  }
  return outcome;
}

module.exports = { probe, compiler, runtimeLength };
