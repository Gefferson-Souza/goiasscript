import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const require = createRequire(import.meta.url);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const inputs = { full: readFileSync(new URL('./input-full.js', import.meta.url), 'utf8'), user: readFileSync(new URL('./input-user.js', import.meta.url), 'utf8') };
try {
  const t0 = performance.now();
  const binding = require('@oxc-minify/binding-wasm32-wasi');
  const out = { tool: 'oxc-wasm', loadMs: +(performance.now() - t0).toFixed(1), exports: Object.keys(binding).slice(0, 8) };
  for (const [name, code] of Object.entries(inputs)) {
    let t = performance.now(); let res = binding.minifySync('input.js', code, {}); const first = performance.now() - t;
    const warm = [];
    for (let i = 0; i < 30; i++) { t = performance.now(); res = binding.minifySync('input.js', code, {}); warm.push(performance.now() - t); }
    out[name] = { bytes: Buffer.byteLength(res.code), gz: gzipSync(res.code, { level: 9 }).length, firstMs: +first.toFixed(2), warmMs: +median(warm).toFixed(3) };
  }
  console.log(JSON.stringify(out));
} catch (e) { console.log('ERRO:', e && e.message ? e.message.slice(0, 300) : e); }
process.exit(0);
