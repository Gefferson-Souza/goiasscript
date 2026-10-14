const { probe } = require('./lib-probe');
for (const src of ['prosa(GoianoMath.PI)', 'prosa(GoianoMath.E)', 'prosa(Math.PI)']) {
  const r = probe(src);
  console.log(JSON.stringify(src), '->', JSON.stringify(r.userJs), '| rodou:', r.runOk, '|', r.error || r.output.join(','));
}
