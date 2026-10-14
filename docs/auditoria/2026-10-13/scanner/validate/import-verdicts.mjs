#!/usr/bin/env node
// Mescla um lote TSV (id, veredicto, nota) em verdicts.json, indexado pela chave estável do item.
// Os ids de um lote valem para o sample.json vigente quando o lote foi escrito (ids mudam se a amostra é
// regerada); prefira a chave explícita "@regra|arquivo|linha|texto". O verdicts.json é a fonte canônica.
// Uso: node validate/import-verdicts.mjs <lote.tsv>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY_TEXT_LENGTH = 40;
const VALID = new Set(['TP', 'TP-fraco', 'FP', 'TN', 'TN?', 'FN']);
const keyOf = (item) => `${item.rule}|${item.file}|${item.line}|${item.text.slice(0, KEY_TEXT_LENGTH)}`;

const sample = JSON.parse(fs.readFileSync(path.join(HERE, 'sample.json'), 'utf8'));
const byId = new Map(sample.map((item) => [item.id, item]));
const verdictsPath = path.join(HERE, 'verdicts.json');
const verdicts = fs.existsSync(verdictsPath) ? JSON.parse(fs.readFileSync(verdictsPath, 'utf8')) : {};
const batchPath = path.resolve(process.argv[2] ?? path.join(HERE, 'verdicts-batch2.tsv'));
const unknownIds = [];
const invalid = [];
for (const line of fs.readFileSync(batchPath, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const [id, verdict, note] = line.split('\t');
  // Primeira coluna "@regra|arquivo|linha|texto": chave explícita, imune a reordenação da amostra.
  const item = id.startsWith('@')
    ? sample.find((entry) => keyOf(entry) === id.slice(1))
    : byId.get(id);
  if (!item) unknownIds.push(id);
  else if (!VALID.has(verdict)) invalid.push(`${id}:${verdict}`);
  else verdicts[keyOf(item)] = { v: verdict, n: note, rule: item.rule, stratum: item.stratum ?? null };
}
fs.writeFileSync(verdictsPath, `${JSON.stringify(verdicts, null, 1)}\n`);
const missing = sample.filter((item) => !verdicts[keyOf(item)]).map((item) => item.id);
process.stdout.write(`veredictos=${Object.keys(verdicts).length} ids desconhecidos=${JSON.stringify(unknownIds)} inválidos=${JSON.stringify(invalid)} sem veredicto=${JSON.stringify(missing)}\n`);
