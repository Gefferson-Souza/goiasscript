'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const child = path.join(__dirname, 'bench-child.js');
const scenarios = ['includes_vary', 'upper_trim', 'replace', 'forin', 'map'];
console.log('cenário'.padEnd(18), 'nativo'.padStart(9), 'goiano sloppy (CLI/REPL)'.padStart(28), 'goiano strict (playground)'.padStart(30));
for (const sc of scenarios) {
  const t = {};
  for (const mode of ['plain', 'goiano', 'goiano_strict']) {
    const out = execFileSync(process.execPath, ['--allow-natives-syntax', child, sc, mode], { encoding: 'utf8' });
    t[mode] = JSON.parse(out.trim().split('\n').pop()).medianMs;
  }
  console.log(sc.padEnd(18), String(t.plain).padStart(9), `${t.goiano} (${(t.goiano / t.plain).toFixed(1)}x)`.padStart(28), `${t.goiano_strict} (${(t.goiano_strict / t.plain).toFixed(1)}x)`.padStart(30));
}
