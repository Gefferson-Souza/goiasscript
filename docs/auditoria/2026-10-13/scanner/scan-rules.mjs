#!/usr/bin/env node
// Scanner de conformidade com as regras de código do dono.
// Uso: node scan-rules.mjs [--repo <caminho>] [--out <pasta>] [--no-dict]
// --no-dict: não lê dicionários do sistema; só acentos, sementes e domínio (determinístico entre máquinas).
// --denylist <json>: palavras portuguesas extras ({"words": [...]}), versionadas junto do código.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGE_ORDER, buildSummary } from './lib/aggregate.mjs';
import { analyzeFile, buildContext } from './lib/analyze-file.mjs';
import { discoverFiles } from './lib/files.mjs';
import { createLexicon } from './lib/lexicon.mjs';
import { loadDeps } from './lib/load-deps.mjs';
import { THRESHOLDS } from './lib/rules.mjs';
import { renderSummaryMarkdown } from './lib/render-summary.mjs';
import { buildSurfaceLexicon } from './lib/surface.mjs';

const SCANNER_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = '<repo>';
const SCANNER_VERSION = '1.0.0';

const write = (text) => process.stdout.write(`${text}\n`);

// Pipe fechado antes do fim (ex.: `| head -1`) não é erro do scanner.
process.stdout.on('error', (error) => {
  if (error.code !== 'EPIPE') throw error;
});

function parseArgs(argv) {
  const options = { repo: DEFAULT_REPO, out: SCANNER_DIR, useDictionaries: true, denylist: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--repo') options.repo = path.resolve(argv[(index += 1)]);
    else if (argv[index] === '--out') options.out = path.resolve(argv[(index += 1)]);
    else if (argv[index] === '--no-dict') options.useDictionaries = false;
    else if (argv[index] === '--denylist') options.denylist = path.resolve(argv[(index += 1)]);
  }
  return options;
}

function gitInfo(repo) {
  const run = (...args) => {
    try {
      return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return null;
    }
  };
  return { head: run('rev-parse', 'HEAD'), branch: run('rev-parse', '--abbrev-ref', 'HEAD') };
}

function buildMeta(options, deps, lexicon, discovery) {
  return {
    scannerVersion: SCANNER_VERSION,
    repo: options.repo,
    git: gitInfo(options.repo),
    node: process.version,
    parsers: deps.versions,
    dictionaries: lexicon.meta,
    thresholds: THRESHOLDS,
    packages: PACKAGE_ORDER,
    filesScanned: discovery.included.length,
    filesExcluded: discovery.excluded,
    generatedAt: new Date().toISOString(),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const deps = loadDeps(options.repo);
  const extraPtWords = options.denylist ? JSON.parse(fs.readFileSync(options.denylist, 'utf8')).words : [];
  const lexicon = createLexicon({ useDictionaries: options.useDictionaries, extraPtWords });
  const discovery = discoverFiles(options.repo);
  const contexts = discovery.included.map((file) => buildContext(file, deps));
  const surface = buildSurfaceLexicon(contexts);
  const results = contexts.map((ctx) => analyzeFile(ctx, lexicon, surface));
  const meta = buildMeta(options, deps, lexicon, discovery);
  meta.surfaceLexicon = { verbatim: surface.verbatim.size, normalized: surface.normalized.size };
  const summary = buildSummary(results, meta);
  fs.mkdirSync(options.out, { recursive: true });
  fs.writeFileSync(path.join(options.out, 'scan-result.json'), `${JSON.stringify({ meta, files: results }, null, 1)}\n`);
  fs.writeFileSync(path.join(options.out, 'scan-summary.json'), `${JSON.stringify(summary, null, 1)}\n`);
  fs.writeFileSync(path.join(options.out, 'scan-summary.md'), renderSummaryMarkdown(summary));
  write(`Arquivos analisados: ${results.length} | ocorrências: ${summary.overall.totalOccurrences}`);
  write(`Saída em ${options.out}: scan-result.json, scan-summary.json, scan-summary.md`);
}

main();
