#!/usr/bin/env node
// Hash canônico de um scan-result.json: ignora só o que varia por execução (data e versão do Node).
// Uso: node gate/canonical-hash.mjs <scan-result.json>
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  process.stderr.write('Uso: canonical-hash.mjs <scan-result.json>\n');
  process.exit(2);
}
const json = JSON.parse(fs.readFileSync(path.resolve(target), 'utf8'));
delete json.meta.generatedAt;
delete json.meta.node;
process.stdout.write(`${crypto.createHash('sha256').update(JSON.stringify(json)).digest('hex')}\n`);
