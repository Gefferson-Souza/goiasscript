// Mede for-in, Object.keys e 'in' com o prelúdio atual (atribuição enumerável) versus defineProperty não enumerável.
(async () => {
  const mode = process.argv[2];
  const { bench, run, do_not_optimize } = await import('mitata');
  const impl = function (p) { return this.hasOwnProperty(p); };
  if (mode === 'enumerable') Object.prototype.tem_propriedade = impl;
  if (mode === 'nonenumerable') Object.defineProperty(Object.prototype, 'tem_propriedade', { value: impl, writable: true, configurable: true, enumerable: false });
  const o = { a: 1, b: 2, c: 3, d: 4 };
  bench(`[${mode}] for-in over 4 own keys`, () => { let n = 0; for (const k in o) n++; return do_not_optimize(n); });
  bench(`[${mode}] Object.keys(o).length`, () => do_not_optimize(Object.keys(o).length));
  bench(`[${mode}] 'zzz' in o (miss)`, () => do_not_optimize('zzz' in o));
  await run({ colors: false });
})();
