// Métricas de conformidade (somente leitura) via TypeScript compiler API.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('<repo>/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript');
const ROOT = '<repo>';
const OUT = process.argv[2];

const SCOPES = [
  'apps/playground/app', 'apps/playground/components', 'apps/playground/lib', 'apps/playground/workers', 'apps/playground/types',
  'apps/engoianador-api/src', 'apps/engoianador-api/test', 'apps/playground-e2e/tests',
];
const EXTRA = ['apps/playground-e2e/playwright.config.ts', 'apps/engoianador-api/vitest.config.ts', 'apps/playground/next.config.mjs', 'apps/playground/tailwind.config.ts', 'apps/playground/scripts/copy-examples.mjs'];

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n); const s = statSync(p);
    if (s.isDirectory()) return walk(p);
    return /\.(ts|tsx|mjs)$/.test(n) && !/\.d\.ts$/.test(n) ? [p] : [];
  });
}
const files = [...SCOPES.flatMap((d) => walk(join(ROOT, d))), ...EXTRA.map((f) => join(ROOT, f))];

const report = { files: [], totals: {} };
const totals = { files: 0, lines: 0, any: 0, asCast: 0, asConst: 0, nonNull: 0, tsIgnore: 0, eslintDisable: 0, consoleCalls: 0, letDecl: 0, varDecl: 0, longFunctions: 0, deepNesting: 0, magicNumbers: 0, commentBlocksOver4: 0, trailingComments: 0, jsdocBlocks: 0 };

const FN_KINDS = new Set([ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.MethodDeclaration]);
const NEST_KINDS = new Set([ts.SyntaxKind.IfStatement, ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement, ts.SyntaxKind.TryStatement, ts.SyntaxKind.SwitchStatement, ts.SyntaxKind.CatchClause]);

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = relative(ROOT, file);
  const lines = text.split('\n').length;
  const f = { file: rel, lines, any: [], asCast: [], nonNull: [], consoleCalls: [], letDecl: [], longFunctions: [], deepNesting: [], magic: [], idents: new Set(), comments: { over4: [], trailing: [], jsdoc: [] }, directives: [] };
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;

  function fnName(n) {
    if (n.name && n.name.getText) return n.name.getText(sf);
    const p = n.parent;
    if (p && ts.isVariableDeclaration(p)) return p.name.getText(sf);
    if (p && ts.isPropertyAssignment(p)) return p.name.getText(sf);
    if (p && ts.isCallExpression(p)) return `(callback de ${p.expression.getText(sf).slice(0, 30)})`;
    return '(anônima)';
  }

  function visit(n, depth, fnDepth) {
    if (n.kind === ts.SyntaxKind.AnyKeyword) f.any.push(lineOf(n.getStart(sf)));
    if (ts.isAsExpression(n)) {
      const isConst = n.type.getText(sf) === 'const';
      if (!isConst) f.asCast.push(`${lineOf(n.getStart(sf))}: as ${n.type.getText(sf).slice(0, 40)}`); else totals.asConst++;
    }
    if (ts.isNonNullExpression(n)) f.nonNull.push(lineOf(n.getStart(sf)));
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.expression.getText(sf) === 'console') f.consoleCalls.push(`${lineOf(n.getStart(sf))}: console.${n.expression.name.text}`);
    if (ts.isVariableDeclarationList(n)) {
      if (n.flags & ts.NodeFlags.Let) f.letDecl.push(lineOf(n.getStart(sf)));
      if (!(n.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const))) f.letDecl.push(`${lineOf(n.getStart(sf))}(var)`);
    }
    // identificadores declarados
    if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isFunctionDeclaration(n) || ts.isPropertySignature(n) || ts.isPropertyAssignment(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isMethodDeclaration(n) || ts.isBindingElement(n)) && n.name) {
      const collect = (nm) => { if (ts.isIdentifier(nm)) f.idents.add(nm.text); else if (ts.isObjectBindingPattern(nm) || ts.isArrayBindingPattern(nm)) nm.elements.forEach((e) => e.name && collect(e.name)); };
      collect(n.name);
    }
    // magic numbers (exclui 0, 1, -1; exclui initializer direto de const de módulo e itens de `as const`)
    if (ts.isNumericLiteral(n)) {
      const v = Number(n.text);
      if (![0, 1].includes(v)) {
        const p = n.parent;
        const isNamedConst = p && ts.isVariableDeclaration(p) && (p.parent.flags & ts.NodeFlags.Const) && ts.isSourceFile(p.parent.parent.parent);
        if (!isNamedConst) f.magic.push(`${lineOf(n.getStart(sf))}: ${n.text} em «${(p ? p.getText(sf) : '').replace(/\s+/g, ' ').slice(0, 70)}»`);
      }
    }
    let nextDepth = depth; let nextFn = fnDepth;
    if (FN_KINDS.has(n.kind) && n.body) {
      const s = lineOf(n.getStart(sf)); const e = lineOf(n.getEnd());
      const span = e - s + 1;
      if (span > 50) f.longFunctions.push(`${s}-${e} (${span} linhas) ${fnName(n)}`);
      nextDepth = 0; nextFn = fnDepth + 1;
    }
    if (NEST_KINDS.has(n.kind)) {
      nextDepth = depth + 1;
      if (nextDepth > 4) f.deepNesting.push(`${lineOf(n.getStart(sf))}: nível ${nextDepth}`);
    }
    ts.forEachChild(n, (c) => visit(c, nextDepth, nextFn));
  }
  visit(sf, 0, 0);

  // comentários / diretivas
  const rawLines = text.split('\n');
  let block = [];
  const flush = () => { if (block.length > 4) f.comments.over4.push(`${block[0]}-${block[block.length - 1]} (${block.length} linhas)`); block = []; };
  rawLines.forEach((l, i) => {
    const t = l.trim();
    const isCommentOnly = /^(\/\/|\/\*|\*|\{\/\*)/.test(t);
    if (isCommentOnly) block.push(i + 1); else flush();
    if (/@ts-ignore|@ts-expect-error|@ts-nocheck/.test(l)) f.directives.push(`${i + 1}: ts-directive`);
    if (/eslint-disable/.test(l)) f.directives.push(`${i + 1}: ${t.slice(0, 80)}`);
    // comentário no fim da linha de código (ao lado) — ignora URLs e strings simples
    const m = l.match(/^(.*\S)\s+(\/\/|\/\*)\s*\S/);
    if (m && !/^\s*(\/\/|\/\*|\*)/.test(l) && !/['"`][^'"`]*\/\/[^'"`]*['"`]/.test(m[1]) && !/https?:$/.test(m[1])) f.comments.trailing.push(`${i + 1}: ${l.trim().slice(0, 90)}`);
    if (/^\s*\/\*\*/.test(l)) f.comments.jsdoc.push(i + 1);
  });
  flush();

  f.idents = [...f.idents].sort();
  report.files.push(f);
  totals.files++; totals.lines += lines; totals.any += f.any.length; totals.asCast += f.asCast.length; totals.nonNull += f.nonNull.length;
  totals.tsIgnore += f.directives.filter((d) => /ts-directive/.test(d)).length; totals.eslintDisable += f.directives.filter((d) => /eslint-disable/.test(d)).length;
  totals.consoleCalls += f.consoleCalls.length; totals.letDecl += f.letDecl.length; totals.longFunctions += f.longFunctions.length; totals.deepNesting += f.deepNesting.length;
  totals.magicNumbers += f.magic.length; totals.commentBlocksOver4 += f.comments.over4.length; totals.trailingComments += f.comments.trailing.length; totals.jsdocBlocks += f.comments.jsdoc.length;
}
report.totals = totals;
writeFileSync(OUT, JSON.stringify(report, (k, v) => (v instanceof Set ? [...v] : v), 2));

console.log('TOTAIS', JSON.stringify(totals));
for (const f of report.files) {
  const flags = [];
  if (f.any.length) flags.push(`any@${f.any.join(',')}`);
  if (f.asCast.length) flags.push(`as[${f.asCast.length}]: ${f.asCast.join(' | ')}`);
  if (f.nonNull.length) flags.push(`nonNull@${f.nonNull.join(',')}`);
  if (f.consoleCalls.length) flags.push(`console[${f.consoleCalls.join(' | ')}]`);
  if (f.letDecl.length) flags.push(`let/var@${f.letDecl.join(',')}`);
  if (f.longFunctions.length) flags.push(`FUNÇÕES>50: ${f.longFunctions.join(' | ')}`);
  if (f.deepNesting.length) flags.push(`NESTING>4: ${f.deepNesting.join(' | ')}`);
  if (f.directives.length) flags.push(`diretivas: ${f.directives.join(' | ')}`);
  if (f.comments.over4.length) flags.push(`blocos de comentário >4: ${f.comments.over4.join(' | ')}`);
  console.log(`\n${f.file}  (${f.lines} linhas)`);
  flags.forEach((x) => console.log('   ' + x));
  if (f.magic.length) console.log('   números mágicos: ' + f.magic.join(' || '));
  if (f.comments.trailing.length) console.log('   comentários ao lado: ' + f.comments.trailing.join(' || '));
}
