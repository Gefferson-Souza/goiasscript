'use strict';
const fs = require('fs');

const NODE_MODULES = '/usr/share/antigravity/resources/app/node_modules';
const vsctm = require(`${NODE_MODULES}/vscode-textmate`);
const oniguruma = require(`${NODE_MODULES}/vscode-oniguruma`);

const GRAMMAR_PATH = '<repo>/vscode-extension/syntaxes/goiasscript.tmLanguage.json';

async function loadGrammar(grammarPath = GRAMMAR_PATH) {
  const wasm = fs.readFileSync(`${NODE_MODULES}/vscode-oniguruma/release/onig.wasm`).buffer;
  await oniguruma.loadWASM(wasm);
  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: sources => new oniguruma.OnigScanner(sources),
      createOnigString: text => new oniguruma.OnigString(text),
    }),
    loadGrammar: async scopeName => {
      if (scopeName === 'source.gs') {
        return vsctm.parseRawGrammar(fs.readFileSync(grammarPath, 'utf8'), grammarPath);
      }
      return null;
    },
  });
  return registry.loadGrammar('source.gs');
}

// Tokeniza várias linhas mantendo o estado entre elas.
function tokenizeDocument(grammar, text) {
  const lines = text.split('\n');
  let ruleStack = vsctm.INITIAL;
  const out = [];
  for (const line of lines) {
    const result = grammar.tokenizeLine(line, ruleStack);
    out.push({ line, tokens: result.tokens.map(t => ({ text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes })) });
    ruleStack = result.ruleStack;
  }
  return out;
}

// Escopos (sem o raiz) que cobrem a primeira ocorrência de `needle` em `line`.
function scopesFor(grammar, line, needle) {
  const idx = line.indexOf(needle);
  if (idx < 0) return null;
  const result = grammar.tokenizeLine(line, vsctm.INITIAL);
  const covering = result.tokens.filter(t => t.startIndex <= idx && t.endIndex >= idx + needle.length);
  if (covering.length === 0) {
    const partial = result.tokens.filter(t => t.endIndex > idx && t.startIndex < idx + needle.length);
    return { partial: true, scopes: partial.map(t => t.scopes.slice(1).join(' ')) };
  }
  return { partial: false, scopes: covering[0].scopes.slice(1) };
}

module.exports = { loadGrammar, tokenizeDocument, scopesFor };
