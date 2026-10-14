'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const child = path.join(__dirname, 'bench-child.js');
const scenarios = ['length', 'floor', 'map', 'reduce', 'push', 'includes', 'replace', 'forin', 'forin_array_small_objects'];
const rows = [];
for (const sc of scenarios) {
  const r = {};
  for (const mode of ['plain', 'goiano']) {
    const out = execFileSync(process.execPath, ['--allow-natives-syntax', child, sc, mode], { encoding: 'utf8' });
    r[mode] = JSON.parse(out.trim().split('\n').pop());
  }
  rows.push({ sc, plain: r.plain.medianMs, goiano: r.goiano.medianMs, plainMin: r.plain.minMs, goianoMin: r.goiano.minMs });
}
console.log('cenário'.padEnd(28), 'JS nativo (mediana ms)'.padStart(24), 'como o transpilador emite (mediana ms)'.padStart(40), 'razão'.padStart(8));
for (const r of rows) {
  console.log(r.sc.padEnd(28), String(r.plain).padStart(24), String(r.goiano).padStart(40), (r.goiano / r.plain).toFixed(2).padStart(8) + 'x');
}
