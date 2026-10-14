#!/usr/bin/env node
// Verificação cruzada: roda ESLint 8.57.1 + typescript-eslint (do store do repo, em memória, sem
// escrever nada no repo) com as regras equivalentes e compara com a saída do scanner.
// Uso: node gate/eslint-crosscheck.mjs [--repo <caminho>] [--scan <scan-result.json>] [--out <arquivo.json>]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { discoverFiles } from '../lib/files.mjs';
import { GATE_RULES, appliesTo } from './gate-config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCANNER_DIR = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const argValue = (flag, fallback) => (args.includes(flag) ? path.resolve(args[args.indexOf(flag) + 1]) : fallback);
const repo = argValue('--repo', '<repo>');
const scanPath = argValue('--scan', path.join(SCANNER_DIR, 'scan-result.json'));
const outPath = argValue('--out', path.join(SCANNER_DIR, 'out', 'eslint-crosscheck.json'));

const requireFromRepo = createRequire(path.join(repo, 'node_modules', '.pnpm', 'noop.js'));
const { Linter } = requireFromRepo('eslint');
const tsParser = requireFromRepo('@typescript-eslint/parser');
const tsPlugin = requireFromRepo('@typescript-eslint/eslint-plugin');
const eslintVersion = requireFromRepo('eslint/package.json').version;
const tsEslintVersion = requireFromRepo('@typescript-eslint/eslint-plugin/package.json').version;

const linter = new Linter();
linter.defineParser('ts-parser', tsParser);
for (const name of ['no-explicit-any', 'ban-ts-comment', 'no-magic-numbers']) {
  linter.defineRule(`@typescript-eslint/${name}`, tsPlugin.rules[name]);
}
const commentsPlugin = createRequire(path.join(SCANNER_DIR, 'gate', 'deps', 'noop.js'))('@eslint-community/eslint-plugin-eslint-comments');
linter.defineRule('@eslint-community/eslint-comments/require-description', commentsPlugin.rules['require-description']);

function parserConfig(file) {
  const isTs = ['.ts', '.tsx'].includes(file.ext);
  const parserOptions = {
    ecmaVersion: 'latest',
    sourceType: file.ext === '.js' ? 'script' : 'module',
    ecmaFeatures: { jsx: file.ext === '.tsx' },
  };
  return isTs ? { parser: 'ts-parser', parserOptions } : { parserOptions };
}

function ruleNameFor(ruleKey, file) {
  const spec = GATE_RULES[ruleKey];
  const isTs = ['.ts', '.tsx'].includes(file.ext);
  if (spec.eslint === 'no-magic-numbers' && isTs) return '@typescript-eslint/no-magic-numbers';
  return spec.eslint;
}

function runRule(ruleKey, file, text) {
  const spec = GATE_RULES[ruleKey];
  const ruleName = ruleNameFor(ruleKey, file);
  const config = {
    ...parserConfig(file),
    env: { es2022: true, node: true, browser: true },
    rules: { [ruleName]: ['error', ...spec.options] },
  };
  const messages = linter.verify(text, config, { filename: file.rel, allowInlineConfig: false });
  const fatal = messages.filter((message) => message.fatal);
  return { findings: messages.filter((message) => !message.fatal && message.ruleId === ruleName), fatal };
}

function main() {
  const { included } = discoverFiles(repo);
  const results = {};
  const fatalParses = [];
  for (const ruleKey of Object.keys(GATE_RULES)) results[ruleKey] = {};
  for (const file of included) {
    const text = fs.readFileSync(file.abs, 'utf8');
    for (const [ruleKey, spec] of Object.entries(GATE_RULES)) {
      if (!appliesTo(spec.scope, file)) continue;
      const { findings, fatal } = runRule(ruleKey, file, text);
      if (fatal.length) fatalParses.push({ file: file.rel, rule: ruleKey, message: fatal[0].message });
      results[ruleKey][file.rel] = findings.map((finding) => ({ line: finding.line, message: finding.message.slice(0, 140) }));
    }
  }
  const scan = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    `${JSON.stringify({ eslintVersion, tsEslintVersion, scanCommit: scan.meta.git.head, fatalParses, results }, null, 1)}\n`,
  );
  process.stdout.write(`ESLint ${eslintVersion} | typescript-eslint ${tsEslintVersion} | parse fatais: ${fatalParses.length}\n`);
  for (const [ruleKey, perFile] of Object.entries(results)) {
    const total = Object.values(perFile).reduce((sum, list) => sum + list.length, 0);
    const files = Object.values(perFile).filter((list) => list.length > 0).length;
    process.stdout.write(`${ruleKey.padEnd(5)} ${GATE_RULES[ruleKey].eslint.padEnd(40)} ocorrências=${String(total).padStart(4)} arquivos=${files}\n`);
  }
  if (fatalParses.length) process.stdout.write(`${JSON.stringify(fatalParses.slice(0, 5), null, 1)}\n`);
}

main();
