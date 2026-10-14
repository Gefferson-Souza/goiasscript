const show = (label, v) => console.log(label.padEnd(52), Object.is(v, -0) ? '-0' : String(v));
show('-0 + 0   (so x + 0 -> x is wrong for x = -0)', -0 + 0);
show('-5 * 0   (so x * 0 -> 0 is wrong for x < 0)', -5 * 0);
show('NaN * 0  (so x * 0 -> 0 is wrong for NaN)', NaN * 0);
console.log('NaN < 1 =', NaN < 1, '| !(NaN >= 1) =', !(NaN >= 1), '(so a<b -> !(a>=b) is wrong with NaN)');
console.log('"3" * 1 =', JSON.stringify("3" * 1), '(x * 1 -> x is wrong unless x is a Number)');
const log = []; const o = { valueOf() { log.push('valueOf'); return 1; } }; void (o + 1);
console.log('unused expression `o + 1` ran valueOf:', JSON.stringify(log), '(dropping it changes behavior)');
let n = 0; const g = { get a() { n++; return 1; } }; void g.a; void g.a;
console.log('two reads of g.a ran the getter', n, 'times (CSE into one read would change this)');
try { (function () { f(); let x = 1; function f() { return x; } })(); } catch (e) { console.log('TDZ read throws:', e.constructor.name, '(inlining/removing `let x` would change this)'); }
let diffPow = 0, diffSqrt = 0; const N = 5e6;
for (let i = 0; i < N; i++) { const x = Math.random() * 1000; if (x ** 2 !== x * x) diffPow++; if (x ** 0.5 !== Math.sqrt(x)) diffSqrt++; }
console.log(`random doubles in [0,1000): x**2 !== x*x for ${diffPow}/${N}; x**0.5 !== Math.sqrt(x) for ${diffSqrt}/${N}`);
