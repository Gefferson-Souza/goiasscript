// Uso: node verify.mjs <pasta-com-package.json-e-node_modules> 
// A pasta de dependências precisa de: acorn@8.19.0, meriyah@6.1.4, @babel/parser@7.29.9,
// oxc-parser@0.154.0 e typescript@5.9.3 (versões usadas na pesquisa de 2026-10-13).
import { createRequire } from 'node:module';
const depsRoot = process.argv[2];
const require = createRequire(`${depsRoot}/package.json`);
const acorn = require('acorn');
const meriyah = require('meriyah');
const babel = require('@babel/parser');
const oxc = require('oxc-parser');

console.log(`node ${process.version} | unicode ${process.versions.unicode} | icu ${process.versions.icu}`);

const composed = 'é';
const decomposed = 'é';
console.log('--- normalization behaviour of JS itself ---');
console.log('composed === decomposed:', composed === decomposed, '| lengths (UTF-16 units):', composed.length, decomposed.length);
console.log('normalize(NFC) equal:', decomposed.normalize('NFC') === composed);
console.log('ID_Start+ID_Continue* matches NFD form:', /^\p{ID_Start}\p{ID_Continue}*$/u.test(decomposed), '| U+0301 is ID_Continue:', /^\p{ID_Continue}$/u.test('́'), '| U+0301 is ID_Start:', /^\p{ID_Start}$/u.test('́'));
try { acorn.parse(`let ${composed} = 1; let ${decomposed} = 2;`, { ecmaVersion: 'latest' }); console.log('acorn: let e-acute(NFC); let e-acute(NFD) accepted -> distinct identifiers'); } catch (e) { console.log('acorn rejected:', e.message); }
try { acorn.parse(`let ${composed} = 1; let ${composed} = 2;`, { ecmaVersion: 'latest' }); console.log('acorn: duplicate same-form accepted (unexpected)'); } catch (e) { console.log('acorn: duplicate same-form rejected ->', e.message); }

console.log('\n--- span offsets: UTF-16 vs UTF-8 ---');
const sources = {
  astral: '"🔥é"; const a = 1;',
  nfd: `let ${decomposed} = 1; let b = 2;`,
};
for (const [label, src] of Object.entries(sources)) {
  const needle = label === 'astral' ? 'const' : 'let b';
  const utf16 = src.indexOf(needle);
  const utf8 = Buffer.byteLength(src.slice(0, utf16));
  const ac = acorn.parse(src, { ecmaVersion: 'latest' });
  const target = ac.body[1];
  const ox = oxc.parseSync('t.js', src, { sourceType: 'script' }).program.body[1];
  const oxRaw = oxc.parseSync('t.js', src, { sourceType: 'script', experimentalRawTransfer: true }).program.body[1];
  console.log(`${label}: UTF-16 index=${utf16} utf8 byte offset=${utf8} | acorn.start=${target.start} | oxc.start=${ox.start} | oxc(rawTransfer).start=${oxRaw.start}`);
}

console.log('\n--- diagnostics for malformed input ---');
const bad = 'let x = ;\nlet y = 1 +;\nfunction (';
try { acorn.parse(bad, { ecmaVersion: 'latest' }); } catch (e) { console.log('acorn  ->', JSON.stringify({ message: e.message, pos: e.pos, loc: e.loc })); }
try { meriyah.parseScript(bad, { next: true }); } catch (e) { console.log('meriyah->', JSON.stringify({ message: e.message, start: e.start, end: e.end, line: e.line, column: e.column })); }
try { babel.parse(bad, { sourceType: 'script' }); } catch (e) { console.log('babel (default)->', JSON.stringify({ message: e.message, code: e.code, reasonCode: e.reasonCode, pos: e.pos, loc: e.loc })); }
try { const r = babel.parse(bad, { sourceType: 'script', errorRecovery: true }); console.log('babel errorRecovery -> errors:', r.errors.length, r.errors.map((x) => `${x.reasonCode}@${x.loc.line}:${x.loc.column}`).join(', ')); } catch (e) { console.log('babel errorRecovery STILL THREW ->', e.message, '| reasonCode', e.reasonCode); }
const ox = oxc.parseSync('t.js', bad, { sourceType: 'script' });
console.log('oxc    -> errors:', ox.errors.length, JSON.stringify(ox.errors.map((x) => ({ severity: x.severity, message: x.message, help: x.helpMessage, label: x.labels?.[0]?.message, start: x.labels?.[0]?.start }))).slice(0, 700));

console.log('\n--- keyword-as-property-name ---');
for (const src of ['obj.const = 1; ({ const: 2, class() {} });', 'var o = { if: 1 }; o.if;']) {
  try { acorn.parse(src, { ecmaVersion: 'latest' }); console.log('acorn accepts:', JSON.stringify(src)); } catch (e) { console.log('acorn rejects:', JSON.stringify(src), e.message); }
}
