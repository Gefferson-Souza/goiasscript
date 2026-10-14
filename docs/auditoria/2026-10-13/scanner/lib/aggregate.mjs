import { RULES, evaluateFile, fileScore } from './rules.mjs';

export const PACKAGE_ORDER = ['core', 'vscode-extension', 'playground', 'engoianador-api', 'playground-e2e'];
const TOP_LIMIT = 20;

const pct = (part, whole) => (whole === 0 ? 0 : Number(((part / whole) * 100).toFixed(1)));
const sum = (values) => values.reduce((total, value) => total + value, 0);

function emptyCell() {
  return { occurrences: 0, filesAffected: 0, filesApplicable: 0 };
}

function buildRuleTable(entries) {
  const table = {};
  for (const rule of RULES) {
    const cell = emptyCell();
    for (const { evaluation } of entries) {
      const outcome = evaluation[rule.id];
      if (!outcome.applicable) continue;
      cell.filesApplicable += 1;
      cell.occurrences += outcome.count;
      if (outcome.count > 0) cell.filesAffected += 1;
    }
    table[rule.id] = cell;
  }
  return table;
}

function identifierStats(files) {
  const items = files.flatMap((f) => f.identifiers.items);
  const count = (predicate) => items.filter(predicate).length;
  const ptNames = new Set(items.filter((i) => i.surface !== 'surface-exact' && i.tier !== 'domain').map((i) => i.name));
  return {
    declaredTotal: sum(files.map((f) => f.identifiers.declaredTotal)),
    ptInternalStrong: count((i) => i.surface === 'internal' && i.tier === 'strong'),
    ptInternalWeak: count((i) => i.surface === 'internal' && i.tier === 'weak'),
    ptMirror: count((i) => i.surface === 'surface-mirror' && i.tier !== 'domain'),
    ptSurfaceExact: count((i) => i.surface === 'surface-exact' && i.tier !== 'domain'),
    domainTier: count((i) => i.tier === 'domain'),
    distinctPtNames: ptNames.size,
    embeddedDeclared: sum(files.map((f) => f.identifiers.declaredEmbedded)),
    ptInEmbedded: count((i) => i.embedded && i.surface === 'internal' && i.tier !== 'domain'),
  };
}

function commentStats(files) {
  const comments = files.map((f) => f.comments);
  const languages = { pt: 0, en: 0, unk: 0 };
  for (const c of comments) for (const key of Object.keys(languages)) languages[key] += c.languages[key];
  const codeLines = sum(files.map((f) => f.size.codeLines));
  const commentLines = sum(files.map((f) => f.size.commentLines));
  return {
    total: sum(comments.map((c) => c.total)),
    prose: sum(comments.map((c) => c.prose)),
    directives: sum(comments.map((c) => c.directives)),
    jsdoc: sum(comments.map((c) => c.jsdoc)),
    jsdocPrivate: sum(comments.map((c) => c.jsdocPrivate.length)),
    inBodyCandidates: sum(comments.map((c) => c.inBody.length)),
    weakHistoryCandidates: sum(comments.map((c) => c.weakHistory.length)),
    languages,
    commentLines,
    codeLines,
    commentToCodePct: pct(commentLines, codeLines),
  };
}

function consoleStats(files) {
  const byRole = {};
  const byMethod = {};
  for (const file of files) {
    if (file.isTest) continue;
    byRole[file.role] = (byRole[file.role] ?? 0) + file.consoleCalls.length;
    for (const call of file.consoleCalls) byMethod[call.method] = (byMethod[call.method] ?? 0) + 1;
  }
  return { byRole, byMethod };
}

function miscStats(files) {
  const all = files.flatMap((f) => f.functions);
  const containers = all.filter((fn) => fn.testContainer && fn.lines > 50);
  return {
    nonNullAssertions: sum(files.map((f) => f.typeEscapes.nonNull.length)),
    typeCasts: sum(files.map((f) => f.typeEscapes.cast.length)),
    doubleCasts: sum(files.map((f) => f.typeEscapes.doubleCast.length)),
    reassignedLet: sum(files.map((f) => f.mutation.reassignedLet)),
    reduceAccumulatorIdioms: sum(files.map((f) => f.mutation.paramPropertyMutations.filter((m) => m.idiom).length)),
    catchDiscardingError: sum(files.map((f) => f.catches.discarding.length)),
    jsdocAnyInJs: sum(files.map((f) => f.suppressions.jsdocAny.length)),
    tsDirectivesTotal: sum(files.map((f) => f.suppressions.tsDirectives.length)),
    eslintDisablesTotal: sum(files.map((f) => f.suppressions.eslintDisables.length)),
    nominalStringSites: sum(files.map((f) => f.magicStrings.nominalSites)),
    describeContainersOver50: containers.length,
    describeContainerLines: sum(containers.map((fn) => fn.lines)),
    functionsTotal: all.length,
    functionsOver50Raw: all.filter((fn) => fn.lines > 50).length,
    functionsOver50AfterEmbedded: all.filter((fn) => fn.lines - fn.templateLines - fn.jsxLines > 50 && !fn.testContainer).length,
  };
}

function packageBlock(entries) {
  const files = entries.map((e) => e.file);
  return {
    files: files.length,
    lines: sum(files.map((f) => f.size.lines)),
    codeLines: sum(files.map((f) => f.size.codeLines)),
    rules: buildRuleTable(entries),
    identifiers: identifierStats(files),
    comments: commentStats(files),
    console: consoleStats(files),
    misc: miscStats(files),
  };
}

function conformanceTable(table) {
  const result = {};
  for (const rule of RULES) {
    const cell = table[rule.id];
    const conformant = cell.filesApplicable - cell.filesAffected;
    result[rule.id] = { applicable: cell.filesApplicable, conformant, pct: pct(conformant, cell.filesApplicable) };
  }
  return result;
}

function worstFiles(entries) {
  return entries
    .map(({ file, evaluation }) => {
      const score = fileScore(evaluation);
      const counts = Object.fromEntries(RULES.filter((r) => evaluation[r.id].count > 0).map((r) => [r.id, evaluation[r.id].count]));
      return { file: file.file, pkg: file.pkg, role: file.role, lines: file.size.lines, score: score.pct, counts, total: sum(Object.values(counts)) };
    })
    .sort((a, b) => b.score - a.score || b.total - a.total || a.file.localeCompare(b.file))
    .slice(0, TOP_LIMIT);
}

function largestFunctions(files) {
  return files
    .flatMap((file) =>
      file.functions.map((fn) => ({
        file: file.file,
        pkg: file.pkg,
        line: fn.line,
        name: fn.name,
        kind: fn.kind,
        lines: fn.lines,
        codeLines: fn.codeLines,
        templateLines: fn.templateLines,
        jsxLines: fn.jsxLines,
        adjustedLines: fn.lines - fn.templateLines - fn.jsxLines,
        maxDepth: fn.maxDepth,
        blockNesting: fn.blockNesting,
        testContainer: fn.testContainer,
      })),
    )
    .sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file) || a.line - b.line)
    .slice(0, TOP_LIMIT);
}

function overallStats(entries, table) {
  const hookRules = ['R06', 'R07', 'R08', 'R09', 'R10', 'R14'];
  const sizeRules = ['R01', 'R02', 'R03', 'R04', 'R05'];
  const clean = (ids) => entries.filter(({ evaluation }) => ids.every((id) => evaluation[id].count === 0)).length;
  const strictIds = RULES.map((r) => r.id);
  const cells = sum(RULES.map((r) => table[r.id].filesApplicable));
  const cleanCells = sum(RULES.map((r) => table[r.id].filesApplicable - table[r.id].filesAffected));
  return {
    files: entries.length,
    filesFullyConformant: clean(strictIds),
    filesConformantHookRules: clean(hookRules),
    filesConformantSizeRules: clean(sizeRules),
    cellConformancePct: pct(cleanCells, cells),
    totalOccurrences: sum(RULES.map((r) => table[r.id].occurrences)),
  };
}

export function buildSummary(results, meta) {
  const entries = results.map((file) => ({ file, evaluation: evaluateFile(file) }));
  const packages = {};
  for (const pkg of PACKAGE_ORDER) {
    const subset = entries.filter((e) => e.file.pkg === pkg);
    if (subset.length > 0) packages[pkg] = packageBlock(subset);
  }
  const total = packageBlock(entries);
  return {
    meta,
    rules: RULES.map(({ id, title, owner, weight }) => ({ id, title, owner, weight })),
    packages,
    total,
    conformance: conformanceTable(total.rules),
    overall: overallStats(entries, total.rules),
    topFiles: worstFiles(entries),
    topFunctions: largestFunctions(results),
    evaluations: Object.fromEntries(entries.map(({ file, evaluation }) => [file.file, Object.fromEntries(RULES.map((r) => [r.id, evaluation[r.id].count]))])),
  };
}
