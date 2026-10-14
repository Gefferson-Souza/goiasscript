'use strict';
// Harness compartilhado das sondagens do núcleo. SOMENTE LEITURA no repo:
// importa o código de produção por caminho absoluto e nunca escreve fora deste diretório.
const vm = require('vm');
const util = require('util');

const CORE_SRC = '<repo>/packages/core/src';
const SimpleTranspiler = require(`${CORE_SRC}/compiler/simpleTranspiler`);
const GoianoBuiltins = require(`${CORE_SRC}/goianoMethods/GoianoBuiltins`);
const GoiasScriptCompiler = require(`${CORE_SRC}/compiler`);
const ErrorTranslator = require(`${CORE_SRC}/errors/errorTranslator`);
const ErroGoiano = require(`${CORE_SRC}/errors/ErroGoiano`);

const RUNTIME = new GoianoBuiltins().gerarImplementacaoGoiana();
const RUNTIME_PREFIX_LENGTH = RUNTIME.length + 2; // runtime + '\n\n'

function transpile(code) {
  return new SimpleTranspiler().transpile(code, 'probe.gs');
}

function userPart(js) {
  return js.startsWith(RUNTIME) ? js.slice(RUNTIME_PREFIX_LENGTH) : js;
}

// Executa JS em um contexto vm novo (realm próprio: o runtime mexe nos protótipos
// do realm do contexto, não nos do processo da sondagem).
async function runJs(js, { timeoutMs = 2000, settleMs = 30, extraGlobals = {}, maxLines = 200 } = {}) {
  const out = [];
  let dropped = 0;
  const capture = (...args) => {
    if (out.length < maxLines) out.push(util.format(...args));
    else dropped += 1;
  };
  const sandbox = {
    console: { log: capture, error: capture, warn: capture, info: capture },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...extraGlobals,
  };
  vm.createContext(sandbox);
  try {
    vm.runInContext(js, sandbox, { timeout: timeoutMs, filename: 'gerado.js' });
    if (settleMs) await new Promise(resolve => setTimeout(resolve, settleMs));
    return { ok: true, stdout: out.join('\n'), dropped };
  } catch (error) {
    return {
      ok: false,
      stdout: out.join('\n'),
      dropped,
      error: `${error.name}: ${error.message}`,
    };
  }
}

// Executa JS puro (controle) no mesmo tipo de contexto, sem runtime.
async function runPlainJs(js, opts) {
  return runJs(js, opts);
}

// Pipeline completo: .gs -> JS -> execução. Devolve tudo para o relatório.
async function runGs(gs, opts) {
  const result = transpile(gs);
  if (!result.success) {
    return {
      transpiled: false,
      transpileError: result.error && result.error.message,
      warnings: [],
      user: null,
      run: null,
    };
  }
  const run = await runJs(result.code, opts);
  return {
    transpiled: true,
    warnings: (result.warnings || []).map(w => w.message),
    user: userPart(result.code),
    run,
  };
}

function show(text, max = 400) {
  if (text === null || text === undefined) return String(text);
  const flat = String(text).replace(/\n/g, '⏎');
  return flat.length > max ? `${flat.slice(0, max)}…(+${flat.length - max})` : flat;
}

module.exports = {
  CORE_SRC,
  SimpleTranspiler,
  GoianoBuiltins,
  GoiasScriptCompiler,
  ErrorTranslator,
  ErroGoiano,
  RUNTIME,
  RUNTIME_PREFIX_LENGTH,
  transpile,
  userPart,
  runJs,
  runPlainJs,
  runGs,
  show,
};
