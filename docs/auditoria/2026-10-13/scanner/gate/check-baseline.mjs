#!/usr/bin/env node
// Gate de ratchet: falha quando um arquivo piora numa regra de severidade "error" em relação ao baseline.
// Uso: node gate/check-baseline.mjs --scan <scan-result.json> --baseline <baseline.json>
//        [--policy <policy.json>] [--write-baseline] [--strict-slack] [--github]
// Saída: 0 sem regressão em regra "error"; 1 com regressão (ou com folga, se --strict-slack); 2 uso inválido.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, evaluateFile } from '../lib/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const argValue = (name, fallback) => (flag(name) ? path.resolve(args[args.indexOf(name) + 1]) : fallback);

const scanPath = argValue('--scan', null);
const baselinePath = argValue('--baseline', null);
const policyPath = argValue('--policy', path.join(HERE, 'policy.json'));
if (!scanPath || !baselinePath) {
  process.stderr.write('Uso: check-baseline.mjs --scan <scan-result.json> --baseline <baseline.json> [--policy p.json] [--write-baseline] [--strict-slack] [--github]\n');
  process.exit(2);
}

const scan = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const ruleIds = RULES.map((rule) => rule.id);

function severityFor(file, ruleId) {
  const override = (policy.overrides ?? []).find(
    (entry) => entry.severity[ruleId] && entry.pathPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  return override?.severity[ruleId] ?? policy.severity[ruleId] ?? 'warn';
}

function currentState() {
  const state = {};
  for (const file of scan.files) {
    const evaluation = evaluateFile(file);
    for (const id of ruleIds) {
      if (evaluation[id].count > 0) {
        state[file.file] ??= {};
        state[file.file][id] = { count: evaluation[id].count, items: evaluation[id].items };
      }
    }
  }
  return state;
}

const current = currentState();

if (flag('--write-baseline')) {
  const files = {};
  for (const [file, rules] of Object.entries(current)) {
    files[file] = Object.fromEntries(Object.entries(rules).map(([id, entry]) => [id, entry.count]));
  }
  fs.writeFileSync(baselinePath, `${JSON.stringify({ versao: 1, geradoDe: scan.meta.git?.head ?? null, files }, null, 1)}\n`);
  process.stdout.write(`Baseline gravado: ${Object.keys(files).length} arquivos com violações em ${baselinePath}\n`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files;
const regressions = [];
const slack = [];
const allFiles = new Set([...Object.keys(current), ...Object.keys(baseline)]);
for (const file of [...allFiles].sort()) {
  for (const id of ruleIds) {
    const now = current[file]?.[id]?.count ?? 0;
    const allowed = baseline[file]?.[id] ?? 0;
    if (now > allowed) {
      const items = current[file][id].items;
      regressions.push({ file, id, allowed, now, severity: severityFor(file, id), sample: items.slice(-(now - allowed)) });
    } else if (now < allowed) {
      slack.push({ file, id, allowed, now });
    }
  }
}

const errors = regressions.filter((entry) => entry.severity === 'error');
const warnings = regressions.filter((entry) => entry.severity !== 'error');
const titleOf = (id) => RULES.find((rule) => rule.id === id).title;
const out = (text) => process.stdout.write(`${text}\n`);

for (const entry of regressions) {
  const tag = entry.severity === 'error' ? 'ERRO' : 'AVISO';
  out(`[${tag}] ${entry.file} ${entry.id} (${titleOf(entry.id)}): ${entry.allowed} -> ${entry.now}`);
  for (const item of entry.sample.slice(0, 3)) out(`        linha ~${item.line}: ${item.text}`);
  if (flag('--github')) {
    const first = entry.sample[0];
    const level = entry.severity === 'error' ? 'error' : 'warning';
    out(`::${level} file=${entry.file},line=${first?.line ?? 1},title=${entry.id}::${titleOf(entry.id)} (${entry.allowed} -> ${entry.now})`);
  }
}
for (const entry of slack) out(`[FOLGA] ${entry.file} ${entry.id}: baseline ${entry.allowed}, atual ${entry.now}; rode --write-baseline para travar o ganho`);

out(`\nResumo: ${errors.length} regressão(ões) bloqueante(s), ${warnings.length} aviso(s), ${slack.length} folga(s) de baseline.`);
const failsOnSlack = flag('--strict-slack') && slack.length > 0;
if (errors.length > 0) process.exit(1);
if (failsOnSlack) {
  out('Falha por --strict-slack: atualize o baseline no mesmo PR.');
  process.exit(1);
}
process.exit(0);
