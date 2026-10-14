// Uso: node verify-ts.mjs <pasta-com-package.json-e-node_modules> 
// A pasta de dependências precisa de: acorn@8.19.0, meriyah@6.1.4, @babel/parser@7.29.9,
// oxc-parser@0.154.0 e typescript@5.9.3 (versões usadas na pesquisa de 2026-10-13).
import { createRequire } from 'node:module';
const require = createRequire(`${process.argv[2]}/package.json`);
const ts = require('typescript');
const bad = 'let x = ;\nlet y = 1 +;\nfunction (';
const sourceFile = ts.createSourceFile('t.js', bad, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const diagnostics = sourceFile.parseDiagnostics.map((d) => ({ code: d.code, start: d.start, length: d.length, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
console.log(`typescript ${ts.version} -> ${diagnostics.length} syntax diagnostics for one run:`);
for (const d of diagnostics) console.log(' ', JSON.stringify(d));
console.log('round-trip text identical:', sourceFile.getFullText() === bad);
const kinds = [];
ts.forEachChild(sourceFile, function visit(node) { kinds.push(ts.SyntaxKind[node.kind] + (node.pos === node.end ? '(missing/zero-width)' : '')); ts.forEachChild(node, visit); });
console.log('tree kinds:', kinds.join(' > ').slice(0, 400));
