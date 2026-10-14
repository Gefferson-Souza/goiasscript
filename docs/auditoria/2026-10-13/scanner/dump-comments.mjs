import fs from 'node:fs';
import { loadDeps } from './lib/load-deps.mjs';
import { discoverFiles } from './lib/files.mjs';
import { buildContext } from './lib/analyze-file.mjs';
import { buildCommentRecords } from './lib/analyzers/comment-records.mjs';
import { buildLogicalComments } from './lib/analyzers/comments.mjs';
const repo = '<repo>';
const deps = loadDeps(repo);
const { included } = discoverFiles(repo);
let n = 0;
const out = [];
for (const file of included) {
  const ctx = buildContext(file, deps);
  ctx.commentRecords = buildCommentRecords(ctx);
  const logical = buildLogicalComments(ctx.commentRecords);
  if (!logical.length) continue;
  out.push(`\n## ${file.rel}`);
  for (const c of logical) {
    n += 1;
    const text = c.text.replace(/^[\s*]+/gm, '').replace(/\s+/g, ' ').trim().slice(0, 125);
    out.push(`${c.line}${c.endLine > c.line ? '-' + c.endLine : ''}${c.standalone ? '' : '(lado)'} [${c.kind}/${c.language}] ${text}`);
  }
}
fs.writeFileSync(process.argv[2], out.join('\n') + '\n');
process.stdout.write(`total comentários lógicos: ${n}\n`);
