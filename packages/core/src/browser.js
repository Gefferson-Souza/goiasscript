// Browser-safe entry for goiasscript@1.5+
// Wraps SimpleTranspiler + GoianoBuiltins without the optional v2 modules
// (TypeAnalyzer / ModuleResolver / JITCompiler) that compiler.js tries to
// loadOptional() — those require()s confuse webpack/turbopack at build time.
const SimpleTranspiler = require('./compiler/simpleTranspiler');
const GoianoBuiltins = require('./goianoMethods/GoianoBuiltins');
const ErroGoiano = require('./errors/ErroGoiano');

class GoiasScriptBrowserCompiler {
  constructor(options = {}) {
    this.transpiler = new SimpleTranspiler(options);
    this.builtins = new GoianoBuiltins();
  }

  transpile(code, fileName = 'playground.gs') {
    return this.transpiler.transpile(code, fileName);
  }

  listarMetodosGoianos() {
    return this.builtins.listarMetodosGoianos();
  }

  listarTiposGoianos() {
    return this.builtins.listarTiposGoianos();
  }

  ehMetodoProibido(metodo) {
    return this.builtins.ehMetodoProibido(metodo);
  }
}

module.exports = { GoiasScriptBrowserCompiler, ErroGoiano };
