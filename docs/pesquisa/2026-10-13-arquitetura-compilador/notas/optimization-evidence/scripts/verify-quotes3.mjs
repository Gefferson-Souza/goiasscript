// Confere, contra o texto bruto das páginas, as citações literais usadas nas notas.
const norm = (s) => s
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')
  .replace(/\]\((?:[^)]|\([^)]*\))*\)/g, '')
  .replace(/&#x27;|&#39;|&rsquo;|&lsquo;|’|‘/g, "'").replace(/&quot;|“|”/g, '"')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/[\[\]`*_\\]/g, '').replace(/\s+/g, ' ').toLowerCase();
const checks = [
  ['https://github.com/cs-au-dk/TAJS', ['partial models of the ECMAScript 5', 'not 100% complete', 'enable unsound assumption']],
  ['https://raw.githubusercontent.com/facebookarchive/prepack/main/README.md', ['Not all will pass, increasing conformance is work in progress']],
  ['https://esbuild.github.io/api/', ['esbuild only considers code removable as dead code if it can be sure that there are no hidden side effects', 'tree shaking is disabled', 'The annotation comment is /* @__PURE__ */ and can only precede a new or call expression']],
  ['https://raw.githubusercontent.com/google/closure-compiler/master/src/com/google/javascript/jscomp/FlowSensitiveInlineVariables.java', ['There is exactly one reaching definition at the use of that variable', 'There is exactly one use for that definition of the variable', 'Currently this pass does not operate on the global scope due to compilation time']],
  ['https://raw.githubusercontent.com/facebook/hermes/main/doc/IR.md', ['The only instructions that can access the storage values (Variable and AllocStack) are the Load and Store instructions']],
  ['https://developers.google.com/closure/compiler/docs/compilation_levels', ['ADVANCED_OPTIMIZATIONS also renames global variables, function names, and properties', 'removes code that is provably unreachable', 'The compiler only inlines functions when it determines that inlining is safe and saves space', 'If you do not flag external functions and properties referenced in your code, Closure Compiler will inappropriately rename references in your code, causing mismatches']],
  ['https://rollupjs.org/configuration-options/', ['Note that this does not cover destructuring assignment or getters on objects passed as function parameters', 'Rollup does by default retain any accesses to non-builtin global variables']],
  ['https://nodejs.org/api/modules.html', ["Support 'module.exports' interop export in require(esm)", 'This feature is no longer behind the --experimental-require-module CLI flag', 'contains top-level await']],
  ['https://tc39.es/ecma262/', ['implementation-approximated value representing the result of raising base to the exponent power']],
  ['https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/', ['If these assumptions turn out to be wrong, the optimized code is discarded']],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness', ['so NaN != NaN, and -0 == +0']],
  ['https://v8.dev/blog/fast-properties', ['Adding array-indexed properties does not create new HiddenClasses', 'Array functions perform considerably slower on objects with slow elements']],
  ['https://mathiasbynens.be/notes/shapes-ics', ['Avoid Object.defineProperty on array indices!', 'V8 calls them Maps', 'JavaScriptCore calls them Structures', 'SpiderMonkey calls them Shapes']],
  ['https://mathiasbynens.be/notes/prototypes', ['before other code runs']],
  ['https://v8.dev/blog/maglev', ['generate specialized SSA nodes']],
  ['https://raw.githubusercontent.com/evanw/esbuild/main/docs/architecture.md', ['Symbol binding + constant folding + syntax lowering + syntax mangling']],
  ['https://terser.org/docs/options/', ['Specify "strict" to treat foo.bar as side-effect-free only when foo is certain to not throw']],
  ['https://oxc.rs/docs/guide/usage/minifier.html', ['Mangle variable names and selected property names']],
  ['https://ecma-international.org/publications-and-standards/standards/ecma-426/', ['Source map format specification', 'December 2024']],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode', ['Many compiler optimizations rely on the ability to say that variable X is stored in that location']],
  ['https://raw.githubusercontent.com/Rich-Harris/magic-string/master/README.md', ["It's a small, fast utility for manipulating strings and generating sourcemaps"]],
  ['https://raw.githubusercontent.com/tinylibs/tinybench/main/README.md', ['This is a sample-based heuristic, not a guaranteed bound on the timer', 'Prior art']],
  ['https://codereview.chromium.org/2843473002', ['we can simply roll back the last map transition that the object went through', 'This is a performance experiment']],
  ['https://v8.dev/blog/launching-ignition-and-turbofan', ['reach Chrome Stable in v59']],
];
const get = async (url) => { try { const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 research-verify' }, signal: AbortSignal.timeout(30000) }); return r.ok ? norm(await r.text()) : `HTTP ${r.status}`; } catch (e) { return `ERR ${e.message}`; } };
const texts = await Promise.all(checks.map(([u]) => get(u)));
let found = 0, missing = 0;
checks.forEach(([url, phrases], i) => {
  const t = texts[i];
  if (/^(HTTP|ERR)/.test(t)) { console.log(`${t.padEnd(8)} | ${url}`); missing += phrases.length; return; }
  for (const p of phrases) { const ok = t.includes(norm(p)); ok ? found++ : missing++; console.log(`${ok ? 'FOUND  ' : 'MISSING'} | ${url.replace('https://', '').slice(0, 58)} | ${p.slice(0, 80)}`); }
});
console.log(`\nTOTAL found=${found} missing=${missing}`);
