// Confere, contra o texto bruto das páginas, as citações literais usadas nas notas.
const norm = (s) => s
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')
  .replace(/\]\((?:[^)]|\([^)]*\))*\)/g, '')
  .replace(/&#x27;|&#39;|&rsquo;|&lsquo;|’|‘/g, "'").replace(/&quot;|“|”/g, '"')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/[\[\]`*_\\]/g, '').replace(/\s+/g, ' ').toLowerCase();
const checks = [
  ['https://v8.dev/blog/maglev', ['a fast optimizing compiler that generates good enough code, fast enough', 'In Chrome M117 we introduced a new optimizing compiler: Maglev', "a somewhat traditional static single-assignment (SSA) based approach, using a CFG (control flow graph) rather than TurboFan's more flexible but cache unfriendly sea-of-nodes representation", '10x slower than Sparkplug', '10x faster than TurboFan']],
  ['https://v8.dev/blog/leaving-the-sea-of-nodes', ['the whole JavaScript backend of Turbofan uses Turboshaft instead', 'another CFG-based IR', 'about 3 times more L1 dcache misses', 'compile time got divided by 2 compared to SoN']],
  ['https://v8.dev/blog/launching-ignition-and-turbofan', ['can only optimize a subset of the JavaScript language', 'was not designed to optimize JavaScript code using structured exception handling', 'new JavaScript execution pipeline for V8 v5.9']],
  ['https://v8.dev/blog/adaptor-frame', ['11.2% performance improvement', 'designed to maximise the impact of the arguments adaptor frame']],
  ['https://v8.dev/blog/explicit-compile-hints', ['allFunctionsCalledOnLoad', 'Chrome 136 is now shipping a version where you can select individual files for eager compilation', '17 out of 20 showed improvements, and the average foreground parse and compile times reduction was 630 ms']],
  ['https://v8.dev/blog/code-caching-for-devs', ['Code caches are (currently) associated with the URL of a script', 'Only the functions that are compiled by the time the script finishes executing count towards the code cache', '1 KiB']],
  ['https://v8.dev/blog/mutable-heap-number', ['the stability of the type stored in the slot is crucial for maintaining peak performance', '2.5x', '1.6%']],
  ['https://v8.dev/blog/preparser', ['allocate variables referenced from inner functions on the heap, in a structure called a "context"']],
  ['https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html', ['monomorphic is the fastest possible IC state if you hit the cache all the time', 'ICs in megamorphic state probe global hash table and thus are slowest among ICs', 'worrying about polymorphism is usually futile']],
  ['https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html', ['DCE tries to eliminate operations that have no observable effect on the rest of the program execution', 'use and preferably check results of the computations inside your microbenchmarks to prevent DCE from throwing them away', 'This optimization identifies expressions that produce the same value on all loop iterations and hoists them out of the loop']],
  ['https://raw.githubusercontent.com/v8/v8/main/src/objects/string.h', ['The ConsString class describes string values built by using the addition operator on strings']],
  ['https://webkit.org/blog/10308/speculation-in-javascriptcore/', ['Inline caches are our most powerful profiling source', 'JavaScriptCore embraces the idea of tiering and has four tiers for JavaScript']],
  ['https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/', ["we've changed our optimizing JIT to rely solely on CacheIR data collected by the baseline tiers", '100 for Baseline JIT, roughly 1500 for Warp']],
  ['https://esbuild.github.io/api/', ['tree shaking works with ECMAScript modules but not with CommonJS modules', 'Note that this is only concerned with syntax features, not APIs', 'It also only works if you do not under any circumstances reference a mangled property indirectly', 'Using this feature can break your code in subtle ways', 'Enabling this means esbuild will no longer respect /* @__PURE__ */ comments or the sideEffects field', 'Using this flag can introduce bugs into your code']],
  ['https://esbuild.github.io/content-types/', ['This means none of that code will be eliminated as dead code and none of that code will be minified', 'The value of toString() is not preserved on functions (and classes)']],
  ['https://raw.githubusercontent.com/evanw/esbuild/main/docs/architecture.md', ['There are currently only three full-AST passes in esbuild', 'Try to do as few full-AST passes as possible for better cache locality']],
  ['https://raw.githubusercontent.com/google/closure-compiler/master/README.md', ['Compilation modes other than ADVANCED were always an afterthought and we have deprecated those modes', 'The NPM packages are not built and distributed by Google']],
  ['https://developers.google.com/closure/compiler/docs/compilation_levels', ['If your code does not conform to those assumptions, ADVANCED_OPTIMIZATIONS will produce code that does not run', 'always preserves the functionality of syntactically valid JavaScript, provided that the code does not access local variables using string names']],
  ['https://raw.githubusercontent.com/facebook/hermes/main/doc/IR.md', ['The IR is a Static Single Assignment (SSA) based representation that captures the JavaScript language semantics', 'Function variables that are captured by a closure are allocated in a scope on the heap']],
  ['https://rollupjs.org/configuration-options/', ['getters with side effects will only be retained if the return value is used', 'you should not bundle polyfills that rely on detecting broken builtins', 'Rollup may incorrectly assume that variable is constant throughout the program', 'Rollup will by default deactivate tree-shaking inside try-statements']],
  ['https://raw.githubusercontent.com/facebookarchive/prepack/main/README.md', ['Prepack is a partial evaluator for JavaScript', 'have temporarily set down work on Prepack']],
  ['https://github.com/facebookarchive/prepack', ['archived by the owner on Feb 12, 2022']],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode', ['Strict mode removes most cases where this happens, so the compiler can better optimize strict mode code', 'substantially hinders optimizations like inlining functions', 'The entire contents of JavaScript modules are automatically in strict mode']],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain', ['setting the prototype dynamically disrupts all optimizations that engines have made to the prototype chain']],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in', ['including inherited enumerable properties']],
  ['https://nodejs.org/api/modules.html', ['This feature is no longer experimental', 'ERR_REQUIRE_ASYNC_MODULE', 'v25.4.0']],
  ['https://nodejs.org/api/module.html', ['can not be reused by a different version of Node.js', 'v22.8.0']],
  ['https://tc39.es/ecma426/', ['The version field shall always be the number 3 as an integer', 'The source map format does not have version numbers anymore']],
  ['https://raw.githubusercontent.com/tc39/ecma426/main/proposals/range-mappings.md', ['stage 3']],
  ['https://raw.githubusercontent.com/tc39/ecma426/main/proposals/scopes.md', ['stage 3']],
  ['https://v8.dev/features/top-level-await', ['Top-level await only works at the top level of modules', 'There is no support for classic scripts or non-async functions']],
  ['https://raw.githubusercontent.com/evanwashere/mitata/master/README.md', ['JIT can detect and eliminate code that has no observable effects', 'you must create observable side effects', 'mitata runs garbage collection once after each benchmark warmup']],
  ['https://raw.githubusercontent.com/tinylibs/tinybench/main/README.md', ['No dependencies', 'Tinybench is completely based on the Web APIs with proper timing using process.hrtime or performance.now']],
  ['https://raw.githubusercontent.com/ai/size-limit/main/README.md', ['Size Limit is a performance budget tool for JavaScript', 'checks the size of files with Brotli (default), Gzip or without compression']],
  ['https://fast-check.dev/docs/introduction/', ['fast-check is the property-based testing library for JavaScript and TypeScript', 'shrinks failures down to the smallest inputs that still reproduces them']],
  ['https://www.typescriptlang.org/tsconfig/', ['By default, these helpers are inserted into files which use them. This can result in code duplication if the same helper is used in many different modules']],
  ['https://babeljs.io/docs/babel-plugin-transform-runtime', ['By default this will be added to every file that requires it', 'This option has been removed in Babel 8']],
  ['https://unpkg.com/core-js-pure@3/README.md', ["It's a version without global namespace pollution"]],
  ['https://developer.chrome.com/blog/smooshgate', ["Don't modify objects you don't own!", 'officially resolved by renaming']],
  ['https://raw.githubusercontent.com/mishoo/UglifyJS/master/test/ufuzz/index.js', ['sandbox.same_stdout', 'UglifyJS.minify(original_code, o)']],
  ['https://github.com/cs-au-dk/TAJS', ['TAJS is a dataflow analysis for JavaScript that infers type information and call graphs', 'Remedying the Eval that Men Do']],
  ['https://oxc.rs/docs/guide/usage/minifier.html', ['A high-performance minifier that shrinks your code by removing unused code and transforming to a shorter equivalent', 'Oxc minifier makes some assumptions about your code']],
  ['https://terser.org/docs/options/', ['DANGER: will not check if the name is redefined in scope', 'drop unreferenced functions', 'Pass 2015 or greater to enable compress options that will transform ES5 code into smaller ES6+ equivalent forms']],
  ['https://swc.rs/docs/configuration/minification', ['This API exists on @swc/core, @swc/wasm, @swc/wasm-web']],
  ['https://nodejs.org/en/about/previous-releases', ['May 05, 2026', 'Krypton']],
  ['https://raw.githubusercontent.com/privatenumber/minification-benchmarks/master/README.md', ['oxc-minify', 'google-closure-compiler', '3,169', 'Time is the average of 5 runs']],
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
