function arruma(l) { return l; }
console.log(arruma([2, 1]));
console.log([2, 1].toSorted($gs_ordem));
function $gs_ordem(a, b) {
  const rank = (v) => (typeof v === 'number' ? (Number.isNaN(v) ? 1 : 0) : typeof v === 'string' ? 2 : 3);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return a - b;
  if (ra === 2) return a.localeCompare(b, 'pt-BR');
  return 0;
}