#!/usr/bin/env node
// Calcula taxas de falso positivo por regra a partir da amostra e dos veredictos manuais.
// Veredictos: TP (violação real), TP-fraco (violação pela letra, idiomática ou de baixo valor),
// FP (erro do scanner); TN/TN? (exclusão correta / correta com ressalva) e FN (exclusão indevida)
// valem só para os estratos de exclusão do R14.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(fs.readFileSync(path.join(HERE, 'sample.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(HERE, 'sample.meta.json'), 'utf8'));
const verdicts = JSON.parse(fs.readFileSync(path.join(HERE, 'verdicts.json'), 'utf8'));
const Z = 1.96;
const keyOf = (item) => `${item.rule}|${item.file}|${item.line}|${item.text.slice(0, 40)}`;

function wilson(k, n) {
  if (n === 0) return { low: 0, high: 0 };
  const p = k / n;
  const denom = 1 + (Z * Z) / n;
  const center = (p + (Z * Z) / (2 * n)) / denom;
  const half = (Z * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n))) / denom;
  return { low: Math.max(0, center - half), high: Math.min(1, center + half) };
}

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const tally = (items) => {
  const counts = { TP: 0, 'TP-fraco': 0, FP: 0, TN: 0, 'TN?': 0, FN: 0 };
  const pending = [];
  for (const item of items) {
    const verdict = verdicts[keyOf(item)];
    if (!verdict) pending.push(item.id);
    else counts[verdict.v] += 1;
  }
  return { counts, pending };
};

function groupOf(item) {
  return item.rule === 'R14' ? `R14/${item.stratum}` : item.rule;
}

const groups = {};
for (const item of sample) (groups[groupOf(item)] ??= []).push(item);

const rows = [];
for (const [groupId, items] of Object.entries(groups)) {
  const { counts, pending } = tally(items);
  const population = meta.groups[groupId].populacao;
  const n = items.length;
  const exclusion = groupId.includes('excluída');
  const bad = exclusion ? counts.FN : counts.FP;
  const interval = wilson(bad, n);
  rows.push({
    group: groupId, population, n, census: n >= population, exclusion,
    ...counts, pending, rate: bad / n, low: interval.low, high: interval.high,
    noise: exclusion ? null : (counts.FP + counts['TP-fraco']) / n,
  });
}

const r14Counted = rows.filter((row) => row.group.startsWith('R14/') && !row.exclusion);
const r14Population = r14Counted.reduce((sum, row) => sum + row.population, 0);
const r14Fp = r14Counted.reduce((sum, row) => sum + (row.FP / row.n) * row.population, 0) / r14Population;
const r14Noise = r14Counted.reduce((sum, row) => sum + ((row.FP + row['TP-fraco']) / row.n) * row.population, 0) / r14Population;
const r14N = r14Counted.reduce((sum, row) => sum + row.n, 0);
const r14Bad = r14Counted.reduce((sum, row) => sum + row.FP, 0);
const r14Interval = wilson(r14Bad, r14N);

const result = { rows, r14Aggregate: { population: r14Population, sampled: r14N, fpRateStratified: r14Fp, noiseStratified: r14Noise, ci: r14Interval } };
fs.writeFileSync(path.join(HERE, 'fp-rates.json'), `${JSON.stringify(result, null, 1)}\n`);

const out = [];
out.push('| Grupo | População | Amostra | TP | TP-fraco | FP | Taxa de FP | IC 95% (Wilson) | Ruído (FP+fraco) |');
out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  if (row.exclusion) continue;
  const ci = row.census ? 'censo' : `${pct(row.low)}–${pct(row.high)}`;
  out.push(`| ${row.group} | ${row.population} | ${row.n} | ${row.TP} | ${row['TP-fraco']} | ${row.FP} | ${pct(row.rate)} | ${ci} | ${pct(row.noise)} |`);
}
out.push('');
out.push('| Estrato de exclusão (R14) | População | Amostra | TN | TN? | FN | Taxa de exclusão indevida |');
out.push('| --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows.filter((r) => r.exclusion)) {
  out.push(`| ${row.group} | ${row.population} | ${row.n} | ${row.TN} | ${row['TN?']} | ${row.FN} | ${pct(row.rate)} (IC ${pct(row.low)}–${pct(row.high)}) |`);
}
out.push('');
out.push(`R14 contado (3 estratos): população ${r14Population}, amostra ${r14N}, FP estratificado ${pct(r14Fp)} (IC amostral ${pct(r14Interval.low)}–${pct(r14Interval.high)}), ruído estratificado ${pct(r14Noise)}.`);
const pendingAll = rows.flatMap((row) => row.pending);
out.push(pendingAll.length ? `Itens sem veredicto: ${pendingAll.join(', ')}` : 'Todos os itens da amostra têm veredicto.');
process.stdout.write(`${out.join('\n')}\n`);
