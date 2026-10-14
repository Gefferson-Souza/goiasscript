import fs from 'node:fs';
import { loadDeps } from './lib/load-deps.mjs';
import { discoverFiles } from './lib/files.mjs';
import { buildContext } from './lib/analyze-file.mjs';
import { collectDeclared } from './lib/analyzers/identifiers.mjs';
import { createLexicon } from './lib/lexicon.mjs';
const repo = '<repo>';
const deps = loadDeps(repo);
const lexicon = createLexicon();
const { included } = discoverFiles(repo);
const seen = new Map();
for (const file of included) {
  const ctx = buildContext(file, deps);
  for (const d of collectDeclared(ctx)) {
    if (lexicon.analyzeName(d.name).tier) continue;
    seen.set(d.name, (seen.get(d.name) ?? 0) + 1);
  }
}
const names = [...seen.keys()].sort((a, b) => a.localeCompare(b));
process.stdout.write(`nomes distintos NÃO marcados: ${names.length}\n${names.join(' ')}\n`);
