import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DICT_DIR = '/usr/share/dict';
const PT_DICTIONARIES = ['brazilian', 'portuguese'];
const EN_DICTIONARIES = ['american-english', 'british-english'];
const MIN_DICTIONARY_TOKEN = 4;
const MIN_SUFFIX_TOKEN = 6;

const ACCENT_PATTERN = /[áàâãäéèêëíìîïóòôõöúùûüçñ]/i;
const PT_SUFFIX_PATTERN = /(cao|coes|mente|idade|eiro|eira|inho|inha|avel|ivel|oso|osa|ario|aria|ncia)$/;

// Palavras portuguesas de uso comum em código que também existem no dicionário inglês.
const PT_FORCED = new Set([
  'valor', 'valores', 'eh', 'nao', 'sim', 'pra', 'uai', 'vai', 'faz', 'dia', 'mes', 'ano', 'sem',
  'tem', 'diz', 'ate', 'ver', 'cor', 'trem', 'prosa', 'balaio', 'arapuca', 'barraco', 'nome',
  'lista', 'saida', 'entrada', 'erro', 'codigo', 'arquivo', 'linha', 'coluna', 'texto', 'numero',
  'tipo', 'tipos', 'metodo', 'metodos', 'funcao', 'classe', 'variavel', 'objeto', 'chave', 'conta',
  'mensagem', 'caminho', 'pasta', 'padrao', 'resultado', 'retorno', 'comando', 'parametro',
  'argumento', 'opcao', 'opcoes', 'sorteio', 'sorteia', 'mapear', 'filtrar', 'reduzir', 'empurrar',
  'trocar', 'dividir', 'juntar', 'aparar', 'fatiar', 'pedaco', 'letra', 'posicao', 'inicio', 'fim',
  'inicial', 'quantidade', 'buscar', 'substituir', 'separador', 'proibido', 'proibidos',
  'goiano', 'goiana', 'goianos', 'goianas', 'goianes', 'dedo', 'prosear', 'fuca', 'fucar',
  'dado', 'dados', 'tempo', 'antes', 'fora', 'pronto', 'volta', 'segue', 'fica', 'boas',
  'bonito', 'continua', 'durante', 'como', 'amigo', 'testes', 'clique', 'devolve',
  'evita', 'impede', 'aprepara', 'tokenizar', 'tokeniza', 'transpilar', 'transpila',
  'transpilado', 'transpilam', 'sanitiza', 'sanitizada', 'reseta', 'loga', 'pobrema', 'vixe',
  'cadim', 'tchau', 'multilinha', 'multilinhas', 'desbalanceadas', 'autocompletar', 'viralizar',
  'igualim', 'inherda', 'chabu',
]);

// Marca de domínio: "goiano" é palavra portuguesa, mas é o vocabulário do produto.
const DOMAIN_TOKENS = new Set(['goiano', 'goiana', 'goianos', 'goianas']);
const DOMAIN_PREFIX_PATTERN = /^engoian/;
const BRAND_TOKENS = new Set(['goias', 'goiasscript', 'gs', 'engoianador']);

// Vocabulário técnico em inglês que dicionários pt/en costumam não cobrir.
const TECH_NEUTRAL = new Set([
  'app', 'args', 'arg', 'async', 'await', 'auth', 'bin', 'bool', 'cb', 'cfg', 'cli', 'cmd', 'config',
  'ctx', 'db', 'deps', 'dev', 'dir', 'doc', 'docs', 'el', 'env', 'err', 'fn', 'fs', 'html', 'http',
  'https', 'id', 'idx', 'init', 'io', 'js', 'json', 'lib', 'msg', 'num', 'obj', 'opts', 'param',
  'params', 'pkg', 'prop', 'props', 'ref', 'regex', 'req', 'res', 'rpc', 'src', 'str', 'sync', 'tmp',
  'ts', 'tsx', 'ui', 'url', 'utf', 'util', 'utils', 'uuid', 'ws', 'xml', 'yaml', 'kv', 'og', 'png',
  'jpg', 'svg', 'css', 'cors', 'csp', 'jwt', 'api', 'cdn', 'repl', 'ast', 'jit', 'vsix', 'lsp',
  'monaco', 'ipc', 'dom', 'tsconfig', 'eslint', 'jest', 'playwright', 'wrangler', 'groq', 'llama',
  'webpack', 'regexp', 'stdout', 'stderr', 'stdin', 'argv', 'readline', 'tokenizer', 'lexer',
  'transpile', 'transpiler', 'transpilation', 'noop', 'callback', 'callbacks', 'timeout', 'webhook',
  'mutex', 'enum', 'namespace', 'proto', 'prototype', 'builtins', 'builtin', 'runtime', 'sandbox',
  'worker', 'workers', 'payload', 'readonly', 'todo', 'idx', 'btn', 'cls', 'pre', 'img', 'nav',
  'ok', 'mime', 'ssr', 'seo', 'png', 'ogimage', 'toolbar', 'viewport', 'sourcemap', 'dts',
]);

function stripAccents(word) {
  return word.normalize('NFD').replace(/\p{M}/gu, '');
}

function loadWordSet(fileNames, hashes) {
  const words = new Set();
  for (const fileName of fileNames) {
    const filePath = path.join(DICT_DIR, fileName);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath);
    hashes[fileName] = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
    for (const line of raw.toString('utf8').split('\n')) {
      const entry = line.trim();
      // Só verbetes em minúsculas: maiúsculas são nomes próprios e siglas, que geram conflito falso.
      if (entry !== entry.toLowerCase()) continue;
      const normalized = stripAccents(entry);
      if (/^[a-z]{3,24}$/.test(normalized)) words.add(normalized);
    }
  }
  return words;
}

export function splitWords(name) {
  return name
    .replace(/[_$\-.]+/g, ' ')
    .replace(/([\p{Ll}\d])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .replace(/(\d+)/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeName(name) {
  return stripAccents(name.toLowerCase()).replace(/[_$\-]/g, '');
}

export function createLexicon({ useDictionaries = true, extraPtWords = [] } = {}) {
  const extraPt = new Set(extraPtWords.map((word) => stripAccents(word.toLowerCase())));
  const hashes = {};
  const ptWords = useDictionaries ? loadWordSet(PT_DICTIONARIES, hashes) : new Set();
  const enWords = useDictionaries ? loadWordSet(EN_DICTIONARIES, hashes) : new Set();
  const dictionariesAvailable = ptWords.size > 0 && enWords.size > 0;

  function classifyToken(word) {
    const lower = word.toLowerCase();
    const plain = stripAccents(lower);
    if (/^\d+$/.test(plain)) return { label: 'neutral', basis: 'short' };
    if (ACCENT_PATTERN.test(lower)) return { label: 'pt', basis: 'accent' };
    if (plain.length < 2) return { label: 'neutral', basis: 'short' };
    if (BRAND_TOKENS.has(plain)) return { label: 'neutral', basis: 'brand' };
    if (DOMAIN_TOKENS.has(plain) || DOMAIN_PREFIX_PATTERN.test(plain)) return { label: 'pt', basis: 'domain' };
    if (TECH_NEUTRAL.has(plain)) return { label: 'neutral', basis: 'tech' };
    if (PT_FORCED.has(plain) || extraPt.has(plain)) return { label: 'pt', basis: 'seed' };
    if (plain.length < MIN_DICTIONARY_TOKEN) return { label: 'neutral', basis: 'short' };
    const inPt = ptWords.has(plain);
    const inEn = enWords.has(plain);
    if (inEn) return { label: 'en', basis: inPt ? 'dict-both' : 'dict-en' };
    if (inPt) return { label: 'pt', basis: 'dict-pt' };
    if (plain.length >= MIN_SUFFIX_TOKEN && PT_SUFFIX_PATTERN.test(plain)) {
      return { label: 'pt', basis: 'suffix' };
    }
    return { label: 'neutral', basis: 'unknown' };
  }

  function analyzeName(name) {
    const tokens = splitWords(name).map((word) => ({ word, ...classifyToken(word) }));
    const ptTokens = tokens.filter((token) => token.label === 'pt');
    const strong = ptTokens.filter((token) => ['accent', 'seed', 'dict-pt'].includes(token.basis));
    const weak = ptTokens.filter((token) => token.basis === 'suffix');
    const domain = ptTokens.filter((token) => token.basis === 'domain');
    let tier = null;
    if (strong.length > 0) tier = 'strong';
    else if (weak.length > 0) tier = 'weak';
    else if (domain.length > 0) tier = 'domain';
    return { tier, tokens, ptTokens: ptTokens.map((token) => token.word) };
  }

  return {
    classifyToken,
    analyzeName,
    meta: {
      mode: useDictionaries ? 'dicionarios' : 'deterministico',
      dictionariesAvailable,
      hashes,
      ptSize: ptWords.size,
      enSize: enWords.size,
      denylistWords: extraPt.size,
    },
  };
}
