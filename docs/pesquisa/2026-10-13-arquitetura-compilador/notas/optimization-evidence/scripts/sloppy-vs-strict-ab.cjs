(async () => {
  const { bench, run, do_not_optimize, summary } = await import('mitata');
  new Function('String.prototype.tamanhoSloppy = function () { return this.length; }; Array.prototype.mapearSloppy = function (cb) { return this.map(cb); };')();
  new Function('"use strict"; String.prototype.tamanhoStrict = function () { return this.length; }; Array.prototype.mapearStrict = function (cb) { return this.map(cb); };')();
  const strs = Array.from({ length: 256 }, (_, i) => 'goiania-' + i);
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];
  const inc = (x) => x + 1;
  summary(() => {
    bench('str.length', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].length; return do_not_optimize(n); });
    bench('str.tamanhoSloppy()', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].tamanhoSloppy(); return do_not_optimize(n); });
    bench('str.tamanhoStrict()', () => { let n = 0; for (let i = 0; i < strs.length; i++) n += strs[i].tamanhoStrict(); return do_not_optimize(n); });
  });
  summary(() => {
    bench('arr.map(f)', () => do_not_optimize(arr.map(inc)));
    bench('arr.mapearSloppy(f)', () => do_not_optimize(arr.mapearSloppy(inc)));
    bench('arr.mapearStrict(f)', () => do_not_optimize(arr.mapearStrict(inc)));
  });
  await run({ colors: false });
})();
