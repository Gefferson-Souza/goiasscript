#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeFile, buildContext } from './analyze-file.mjs';
import { compareWithBaseline, currentViolations, nextBaseline, readBaseline } from './baseline.mjs';
import { deps } from './deps.mjs';
import { verifyDictionaryLock, writeDictionaryLock } from './dictionary-lock.mjs';
import { discoverFiles, listTrackedFiles, loadScope, pathSegmentFindings, scopeProblems } from './files.mjs';
import { createLexicon } from './lexicon.mjs';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXIT_VIOLATION = 1;
const EXIT_USAGE = 2;
const out = (text) => process.stdout.write(`${text}\n`);

function readOptions(argv) {
  const rootIndex = argv.indexOf('--root');
  return {
    command: argv.find((arg) => !arg.startsWith('--')) ?? 'check',
    root: rootIndex >= 0 ? path.resolve(argv[rootIndex + 1]) : path.resolve(TOOL_DIR, '../..'),
    writeBaseline: argv.includes('--write-baseline'),
  };
}

function violationsOf(root) {
  const scope = loadScope(root);
  const files = listTrackedFiles(root);
  const discovery = discoverFiles(root, scope, files);
  const lexicon = createLexicon();
  const current = currentViolations(discovery.included.map((file) => analyzeFile(buildContext(file, deps), lexicon)));
  for (const finding of pathSegmentFindings(files, scope, lexicon)) {
    current[finding.file] ??= {};
    current[finding.file].R14 = { count: (current[finding.file].R14?.count ?? 0) + 1, items: [finding] };
  }
  return { discovery, current };
}

function check(options) {
  const dir = path.join(options.root, 'tools/rules-scan');
  verifyDictionaryLock(path.join(dir, 'dictionaries.lock.json'));
  const policy = JSON.parse(fs.readFileSync(path.join(dir, 'policy.json'), 'utf8'));
  const { discovery, current } = violationsOf(options.root);
  const baselinePath = path.join(dir, 'baseline.json');
  if (options.writeBaseline) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(nextBaseline(current, readBaseline(baselinePath), policy), null, 2)}\n`);
    out('baseline gravado');
    return 0;
  }
  const comparison = compareWithBaseline(current, readBaseline(baselinePath) ?? {}, policy);
  const problems = scopeProblems(discovery);
  for (const problem of problems) out(`[ERRO] ${problem}`);
  for (const entry of comparison.errors) {
    out(`[ERRO] ${entry.file} ${entry.id} (${entry.title}): ${entry.allowed} -> ${entry.now}`);
    for (const item of entry.sample.slice(0, 3)) out(`        linha ${item.line}: ${item.text}`);
  }
  for (const entry of comparison.slack) out(`[FOLGA] ${entry.file} ${entry.id}: baseline ${entry.allowed}, atual ${entry.now}; rode --write-baseline`);
  out(`${comparison.warnings.length} aviso(s) de regras não bloqueantes.`);
  return problems.length + comparison.errors.length + comparison.slack.length > 0 ? EXIT_VIOLATION : 0;
}

function main() {
  const options = readOptions(process.argv.slice(2));
  if (options.command === 'lock-dictionaries') {
    writeDictionaryLock(path.join(options.root, 'tools/rules-scan/dictionaries.lock.json'));
    return 0;
  }
  if (options.command !== 'check') {
    out(`comando desconhecido: ${options.command}`);
    return EXIT_USAGE;
  }
  return check(options);
}

try {
  process.exitCode = main();
} catch (error) {
  out(`[ERRO] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = EXIT_USAGE;
}
