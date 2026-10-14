// CommonJS é sloppy por padrão, como o prelúdio avaliado fora do wrapper "use strict" do playground.
(async () => {
  const { bench, run, do_not_optimize, summary } = await import('mitata');
  String.prototype.tamanho = function () { return this.length; };
  Array.prototype.mapear = function (cb) { return this.map(cb); };
  Array.prototype.empurrar = function (...items) { return this.push(...items); };
  new Function('"use strict"; String.prototype.tamanhoStrict = function () { return this.length; }; Array.prototype.mapearStrict = function (cb) { return this.map(cb); }; Array.prototype.empurrarStrict = function (...items) { return this.push(...items); };')();
  Object.defineProperty(Array.prototype, 'mapearAlias', { value: Array.prototype.map, writable: true, configurable: true });
  const tamanhoHelper = (s) => s.length;
  const mapearHelper = (a, cb) => a.map(cb);
  const strs = Array.from({ length: 256 }, (_, i) => 'goiania-' + i);
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];
  const inc = (x) => x + 1;
  summary(() => {
    bench('str.length  (compile-time rewrite)', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].length; return do_not_optimize(n); });
    bench('str.tamanho()  sloppy wrapper (today)', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].tamanho(); return do_not_optimize(n); });
    bench('str.tamanhoStrict()  strict wrapper', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].tamanhoStrict(); return do_not_optimize(n); });
    bench('tamanhoHelper(str)  imported helper', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += tamanhoHelper(strs[i]); return do_not_optimize(n); });
  });
  summary(() => {
    bench('arr.map(f)  (compile-time rewrite)', () => do_not_optimize(arr.map(inc)));
    bench('arr.mapear(f)  sloppy wrapper (today)', () => do_not_optimize(arr.mapear(inc)));
    bench('arr.mapearStrict(f)  strict wrapper', () => do_not_optimize(arr.mapearStrict(inc)));
    bench('arr.mapearAlias(f)  alias = native map', () => do_not_optimize(arr.mapearAlias(inc)));
    bench('mapearHelper(arr, f)  imported helper', () => do_not_optimize(mapearHelper(arr, inc)));
  });
  summary(() => {
    const t = [];
    bench('t.push(i) x64  (compile-time rewrite)', () => { t.length = 0; for (let i = 0; i < 64; i++) t.push(i); return do_not_optimize(t); });
    bench('t.empurrar(i) x64  rest+spread wrapper (today)', () => { t.length = 0; for (let i = 0; i < 64; i++) t.empurrar(i); return do_not_optimize(t); });
    bench('t.empurrarStrict(i) x64  strict rest+spread', () => { t.length = 0; for (let i = 0; i < 64; i++) t.empurrarStrict(i); return do_not_optimize(t); });
  });
  await run({ colors: false });
})();
