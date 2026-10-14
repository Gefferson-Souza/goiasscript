Array.prototype.mapear = function (cb) { return this.map(cb); };
Object.prototype.tem_propriedade = function (p) { return this.hasOwnProperty(p); };
function f(x) { return x + 1; }
function hotMap(a) { return a.map(f); }
const arr = [1, 2, 3, 4];
function loop(n) { let s = 0; for (let i = 0; i < n; i++) s += hotMap(arr).length; return s; }
console.log('### patched BEFORE hot code runs');
loop(3e5); loop(3e5); loop(3e5);
console.log('### done');
