import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
const root = process.argv[2];
const min = Number(process.argv[3] ?? 100000);
const rows = [];
let total = 0;
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const s = statSync(p).size;
      total += s;
      if (s >= min) rows.push([p.slice(root.length + 1), s]);
    }
  }
})(root);
rows.sort((a, b) => b[1] - a[1]);
console.log(`  unpacked total: ${total} bytes`);
for (const [p, s] of rows.slice(0, 4)) {
  const buf = readFileSync(join(root, p));
  const gz = gzipSync(buf, { level: 9 }).length;
  const q = s > 5_000_000 ? 8 : 11;
  const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: q } }).length;
  console.log(`  ${p}\traw=${s}\tgzip9=${gz}\tbrotli(q${q})=${br}`);
}
