#!/usr/bin/env node
// Executa gate/eslintrc.gate.cjs com a API ESLint (8.57.1 do repo) sobre os arquivos do escopo.
// cwd = repo (somente leitura); plugins resolvidos a partir de gate/deps.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { discoverFiles } from '../lib/files.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const repo = process.argv[2] ? path.resolve(process.argv[2]) : '<repo>';
process.env.GATE_RESOLVE_FROM = path.join(HERE, 'deps');
const { ESLint } = createRequire(path.join(repo, 'node_modules', '.pnpm', 'noop.js'))('eslint');

const eslint = new ESLint({
  cwd: repo,
  useEslintrc: false,
  overrideConfigFile: path.join(HERE, 'eslintrc.gate.cjs'),
  resolvePluginsRelativeTo: path.join(HERE, 'deps'),
  allowInlineConfig: false,
});
const { included } = discoverFiles(repo);
const results = await eslint.lintFiles(included.map((file) => file.abs));
const byRule = {};
const bySeverity = { 0: 0, 1: 0, 2: 0 };
const fatal = [];
for (const result of results) {
  for (const message of result.messages) {
    if (message.fatal) fatal.push(`${path.relative(repo, result.filePath)}: ${message.message}`);
    const key = message.ruleId ?? '(parse)';
    byRule[key] ??= { error: 0, warn: 0, files: new Set() };
    byRule[key][message.severity === 2 ? 'error' : 'warn'] += 1;
    byRule[key].files.add(result.filePath);
    bySeverity[message.severity] += 1;
  }
}
process.stdout.write(`ESLint ${ESLint.version} | arquivos ${results.length} | erros ${bySeverity[2]} | avisos ${bySeverity[1]} | fatais ${fatal.length}\n`);
for (const [rule, data] of Object.entries(byRule).sort()) {
  process.stdout.write(`${rule.padEnd(46)} erro=${String(data.error).padStart(4)} aviso=${String(data.warn).padStart(4)} arquivos=${data.files.size}\n`);
}
if (fatal.length) process.stdout.write(`${fatal.slice(0, 5).join('\n')}\n`);
const serial = Object.fromEntries(Object.entries(byRule).map(([rule, data]) => [rule, { error: data.error, warn: data.warn, files: data.files.size }]));
fs.mkdirSync(path.join(HERE, '..', 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, '..', 'out', 'eslint-gate-run.json'), `${JSON.stringify({ eslint: ESLint.version, errors: bySeverity[2], warnings: bySeverity[1], fatal: fatal.length, rules: serial }, null, 1)}\n`);
