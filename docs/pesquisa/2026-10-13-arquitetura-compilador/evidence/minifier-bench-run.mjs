import { readFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const which = process.argv[2];
const inputs = { full: readFileSync(new URL('./input-full.js', import.meta.url), 'utf8'), user: readFileSync(new URL('./input-user.js', import.meta.url), 'utf8') };
const loaders = {
  terser: async () => { const { minify } = await import('terser'); return (c) => minify(c, { compress: true, mangle: true }).then((r) => r.code); },
  uglify: async () => { const U = require('uglify-js'); return (c) => { const r = U.minify(c); if (r.error) throw r.error; return r.code; }; },
  esbuild: async () => { const e = await import('esbuild'); return (c) => e.transformSync(c, { minify: true }).code; },
  esbuildwasm: async () => { const e = await import('esbuild-wasm'); return async (c) => (await e.transform(c, { minify: true })).code; },
  oxc: async () => { const o = await import('oxc-minify'); return (c) => { const r = o.minifySync('input.js', c); if (r.errors && r.errors.length) throw new Error(r.errors[0].message); return r.code; }; },
  swc: async () => { const s = require('@swc/core'); return (c) => s.minifySync(c, { compress: true, mangle: true }).code; },
  swcwasm: async () => { const s = require('@swc/wasm'); return (c) => s.minifySync(c, { compress: true, mangle: true }).code; },
};
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const br = (s) => brotliCompressSync(s, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const t0 = performance.now();
const fn = await loaders[which]();
const loadMs = performance.now() - t0;
const out = { tool: which, loadMs: +loadMs.toFixed(1) };
for (const [name, code] of Object.entries(inputs)) {
  try {
    let t = performance.now(); let res = await fn(code); const first = performance.now() - t;
    new vm.Script(res);
    const warm = [];
    for (let i = 0; i < 30; i++) { t = performance.now(); res = await fn(code); warm.push(performance.now() - t); }
    out[name] = { bytes: Buffer.byteLength(res), gz: gzipSync(res, { level: 9 }).length, br: br(res), firstMs: +first.toFixed(2), warmMs: +median(warm).toFixed(3) };
  } catch (e) { out[name] = { error: String(e.message).slice(0, 120) }; }
}
console.log(JSON.stringify(out));
process.exit(0);
