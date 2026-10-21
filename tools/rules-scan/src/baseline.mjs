import fs from 'node:fs';
import { RULES, evaluateFile } from './rules.mjs';

const BASELINABLE_PREFIX = 'apps/';
const severityOf = (policy, ruleId) => policy.severity[ruleId] ?? 'warn';

export function currentViolations(results) {
  const state = {};
  for (const file of results) {
    const evaluation = evaluateFile(file);
    for (const rule of RULES) {
      if (evaluation[rule.id].count === 0) continue;
      state[file.file] ??= {};
      state[file.file][rule.id] = { count: evaluation[rule.id].count, items: evaluation[rule.id].items };
    }
  }
  return state;
}

// Piora em regra de erro bloqueia; melhora sem baseline atualizado também bloqueia.
export function compareWithBaseline(current, baselineFiles, policy) {
  const errors = [];
  const warnings = [];
  const slack = [];
  for (const file of [...new Set([...Object.keys(current), ...Object.keys(baselineFiles)])].sort()) {
    for (const rule of RULES) {
      const now = current[file]?.[rule.id]?.count ?? 0;
      const allowed = baselineFiles[file]?.[rule.id] ?? 0;
      const blocking = severityOf(policy, rule.id) === 'error';
      if (now > allowed) (blocking ? errors : warnings).push({ file, id: rule.id, title: rule.title, allowed, now, sample: current[file][rule.id].items.slice(-(now - allowed)) });
      else if (now < allowed && blocking) slack.push({ file, id: rule.id, allowed, now });
    }
  }
  return { errors, warnings, slack };
}

export function nextBaseline(current, existing, policy) {
  const files = {};
  for (const [file, rules] of Object.entries(current)) {
    const blocking = Object.entries(rules).filter(([id]) => severityOf(policy, id) === 'error');
    if (blocking.length === 0) continue;
    if (!file.startsWith(BASELINABLE_PREFIX)) throw new Error(`baseline só vale para ${BASELINABLE_PREFIX}*; corrija ${file}`);
    files[file] = Object.fromEntries(blocking.map(([id, entry]) => [id, entry.count]));
    for (const [id, count] of Object.entries(files[file])) {
      if (existing && count > (existing[file]?.[id] ?? 0)) throw new Error(`o baseline só pode melhorar: ${file} ${id} subiria para ${count}`);
    }
  }
  return { version: 1, files };
}

export const readBaseline = (baselinePath) => (fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files : undefined);
