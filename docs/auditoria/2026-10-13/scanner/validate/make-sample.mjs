#!/usr/bin/env node
// Gera a amostra de validação manual. Determinística (semente por grupo), estratificada por pacote e
// incremental: itens já amostrados que continuam na população são mantidos (preservando os rótulos
// manuais); só as reposições são sorteadas. Use --fresh para descartar a amostra anterior.
// Uso: node validate/make-sample.mjs [--repo <caminho>] [--scan <scan-result.json>] [--fresh]
// Saídas: validate/sample.json (itens) e validate/sample.txt (itens com contexto de código).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES } from '../lib/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCANNER_DIR = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const argValue = (flag, fallback) => (args.includes(flag) ? path.resolve(args[args.indexOf(flag) + 1]) : fallback);
const repo = argValue('--repo', '<repo>');
const scan = JSON.parse(fs.readFileSync(argValue('--scan', path.join(SCANNER_DIR, 'scan-result.json')), 'utf8'));
const samplePath = path.join(HERE, 'sample.json');

const SEED = 20261013;
const CONTEXT_RADIUS = 1;
const MAX_LINE_WIDTH = 150;
const KEY_TEXT_LENGTH = 40;
const PLAN = {
  R01: 4, R03: 10, R05: 2, R06: 10, R07: 3, R09: 2, R11: 6, R12: 6, R13: 8, R15: 14, R16: 21, R18: 4, R20: 12, R21: 24,
};
const R14_STRATA = [
  { id: 'internal-strong', take: 14, pick: (i) => i.surface === 'internal' && i.tier === 'strong' && !i.embedded },
  { id: 'internal-embedded', take: 4, pick: (i) => i.surface === 'internal' && i.tier !== 'domain' && i.embedded },
  { id: 'surface-mirror', take: 5, pick: (i) => i.surface === 'surface-mirror' && i.tier !== 'domain' },
  { id: 'surface-exact (excluída)', take: 8, pick: (i) => i.surface === 'surface-exact' && i.tier !== 'domain' },
  { id: 'domain (excluída)', take: 5, pick: (i) => i.tier === 'domain' },
];

export const itemKey = (item) => `${item.rule}|${item.file}|${item.line}|${item.text.slice(0, KEY_TEXT_LENGTH)}`;

function hashString(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, random) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function stratifiedPick(items, take, random) {
  if (items.length <= take) return items;
  const groups = new Map();
  for (const item of items) groups.set(item.pkg, [...(groups.get(item.pkg) ?? []), item]);
  const queues = [...groups.keys()].sort().map((key) => shuffled(groups.get(key), random));
  const picked = [];
  while (picked.length < take && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      if (queue.length > 0 && picked.length < take) picked.push(queue.shift());
    }
  }
  return picked;
}

function itemsForRule(rule) {
  return scan.files.flatMap((file) =>
    rule.applies(file) ? rule.items(file).map((item) => ({ rule: rule.id, ...item, file: file.file, pkg: file.pkg })) : [],
  );
}

function identifierItems(predicate) {
  return scan.files.flatMap((file) =>
    file.identifiers.items.filter(predicate).map((item) => ({
      rule: 'R14',
      line: item.line,
      file: file.file,
      pkg: file.pkg,
      text: `${item.name} (${item.kind}, ${item.tier}, ${item.surface}${item.embedded ? ', embutido' : ''})`,
    })),
  );
}

function context(item) {
  const lines = fs.readFileSync(path.join(repo, item.file), 'utf8').split(/\r?\n/);
  const out = [];
  for (let n = Math.max(1, item.line - CONTEXT_RADIUS); n <= Math.min(lines.length, item.line + CONTEXT_RADIUS); n += 1) {
    out.push(`${n === item.line ? '>' : ' '}${String(n).padStart(4)}| ${lines[n - 1].slice(0, MAX_LINE_WIDTH)}`);
  }
  return out.join('\n');
}

function loadFrozen() {
  if (args.includes('--fresh') || !fs.existsSync(samplePath)) return new Map();
  return new Map(JSON.parse(fs.readFileSync(samplePath, 'utf8')).map((item) => [itemKey(item), item]));
}

function drawGroup(groupId, population, take, frozen) {
  const order = new Map([...frozen.keys()].map((key, index) => [key, index]));
  const kept = population
    .filter((item) => frozen.has(itemKey(item)))
    .sort((a, b) => order.get(itemKey(a)) - order.get(itemKey(b)));
  const rest = population.filter((item) => !frozen.has(itemKey(item)));
  const random = mulberry32(SEED + hashString(groupId));
  const topUp = stratifiedPick(rest, Math.max(0, take - kept.length), random);
  return { kept: kept.slice(0, take), added: topUp };
}

function main() {
  const frozen = loadFrozen();
  const sample = [];
  const report = {};
  const groups = [
    ...RULES.filter((rule) => PLAN[rule.id]).map((rule) => ({ id: rule.id, take: PLAN[rule.id], population: itemsForRule(rule) })),
    ...R14_STRATA.map((stratum) => ({ id: `R14/${stratum.id}`, stratum: stratum.id, take: stratum.take, population: identifierItems(stratum.pick) })),
  ];
  for (const group of groups) {
    const { kept, added } = drawGroup(group.id, group.population, group.take, frozen);
    report[group.id] = { populacao: group.population.length, mantidos: kept.length, sorteados: added.length };
    for (const item of [...kept, ...added]) sample.push({ ...item, ...(group.stratum ? { stratum: group.stratum } : {}) });
  }
  sample.forEach((item, index) => {
    item.id = `${item.rule}-${String(index + 1).padStart(3, '0')}`;
  });
  fs.writeFileSync(samplePath, `${JSON.stringify(sample, null, 1)}\n`);
  fs.writeFileSync(path.join(HERE, 'sample.meta.json'), `${JSON.stringify({ seed: SEED, groups: report }, null, 1)}\n`);
  const text = sample
    .map((item) => `[${item.id}] ${item.file}:${item.line}${item.stratum ? `  {${item.stratum}}` : ''}\n  achado: ${item.text}\n${context(item)}`)
    .join('\n\n');
  fs.writeFileSync(path.join(HERE, 'sample.txt'), `${text}\n`);
  process.stdout.write(`Amostra: ${sample.length} itens (semente ${SEED})\n${JSON.stringify(report)}\n`);
}

main();
