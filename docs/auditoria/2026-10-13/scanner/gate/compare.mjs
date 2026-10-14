#!/usr/bin/env node
// Compara, por arquivo e linha, as ocorrências do scanner com as do ESLint equivalente.
// Uso: node gate/compare.mjs [--scan scan-result.json] [--eslint out/eslint-crosscheck.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES } from '../lib/rules.mjs';

const SCANNER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argValue = (flag, fallback) => (args.includes(flag) ? path.resolve(args[args.indexOf(flag) + 1]) : fallback);
const scan = JSON.parse(fs.readFileSync(argValue('--scan', path.join(SCANNER_DIR, 'scan-result.json')), 'utf8'));
const eslint = JSON.parse(fs.readFileSync(argValue('--eslint', path.join(SCANNER_DIR, 'out', 'eslint-crosscheck.json')), 'utf8'));
const ruleById = Object.fromEntries(RULES.map((rule) => [rule.id, rule]));

const keyOf = (file, line) => `${file}:${line}`;

function scannerItems(ruleId) {
  const items = new Map();
  for (const file of scan.files) {
    const rule = ruleById[ruleId];
    if (!rule.applies(file)) continue;
    for (const item of rule.items(file)) items.set(keyOf(file.file, item.line), item.text);
  }
  return items;
}

function allLongFunctions() {
  const items = new Map();
  for (const file of scan.files) {
    for (const fn of file.functions) {
      if (fn.lines > 50) items.set(keyOf(file.file, fn.line), `${fn.name}: ${fn.lines} linhas${fn.testContainer ? ' [describe]' : ''}`);
    }
  }
  return items;
}

function accentIdentifiers() {
  const items = new Map();
  for (const file of scan.files) {
    for (const item of file.identifiers.items) {
      if (/[áàâãäéèêëíìîïóòôõöúùûüçñ]/i.test(item.name)) items.set(keyOf(file.file, item.line), `${item.name} (${item.surface})`);
    }
  }
  return items;
}

function eslintItems(ruleKey) {
  const items = new Map();
  for (const [file, list] of Object.entries(eslint.results[ruleKey] ?? {})) {
    for (const finding of list) items.set(keyOf(file, finding.line), finding.message);
  }
  return items;
}

function diff(label, left, right) {
  const onlyLeft = [...left.keys()].filter((key) => !right.has(key));
  const onlyRight = [...right.keys()].filter((key) => !left.has(key));
  process.stdout.write(`\n### ${label}: scanner=${left.size} eslint=${right.size} em comum=${left.size - onlyLeft.length}\n`);
  for (const key of onlyLeft) process.stdout.write(`  só scanner: ${key}  ${left.get(key)}\n`);
  for (const key of onlyRight) process.stdout.write(`  só eslint : ${key}  ${right.get(key)}\n`);
}

const PAIRS = [
  ['R01 max-lines 400', scannerItems('R01'), eslintItems('R01')],
  ['R02 max-lines 800', scannerItems('R02'), eslintItems('R02')],
  ['R03 max-lines-per-function (scanner incluindo describe)', allLongFunctions(), eslintItems('R03')],
  ['R04 max-depth 4', scannerItems('R04'), eslintItems('R04')],
  ['R06 no-console', scannerItems('R06'), eslintItems('R06')],
  ['R07 no-explicit-any', scannerItems('R07'), eslintItems('R07')],
  ['R09 eslint-disable sem motivo x require-description', scannerItems('R09'), eslintItems('R09')],
  ['R12 no-inline-comments', scannerItems('R12'), eslintItems('R12')],
  ['R14 diacríticos x id-match', accentIdentifiers(), eslintItems('R14d')],
  ['R15 no-magic-numbers', scannerItems('R15'), eslintItems('R15')],
  ['R17 no-param-reassign (props:false)', scannerItems('R17'), eslintItems('R17')],
  ['R18 no-param-reassign (props:true)', scannerItems('R18'), eslintItems('R18')],
  ['R20 catch engolido x no-restricted-syntax', scannerItems('R20'), eslintItems('R20s')],
];

for (const [label, left, right] of PAIRS) diff(label, left, right);
diff('R10 TODO sem ticket x no-warning-comments (todos)', scannerItems('R10'), eslintItems('R10'));
