# Optimizing the JavaScript emitted by the GoiásScript transpiler: code generation, optimization passes, runtime/helper strategy and measurement

> Researched 2026-10-13. "Local measurement" means something run in this session on Linux 6.14, Intel i5-12450H (about 2.49 GHz as printed by mitata), Node v24.21.0 (V8 13.6.233.17-node.53). Every script is saved in [optimization-evidence/scripts](optimization-evidence/scripts/) and uses the repo's real transpiler output (to rerun the minifier scripts, `npm i terser esbuild esbuild-wasm oxc-minify @swc/core @swc/wasm uglify-js mitata` next to them and run `make-inputs.cjs` first). Package sizes come from `npm pack` tarballs fetched the same day (gzip level 9; brotli quality 11, except quality 8 for files above 5 MB, which makes those brotli figures slightly pessimistic). Text in quotation marks was re-checked against the raw page text. Third-party benchmark tables are labelled as such. Repo links are relative to this file.

## 0. Baseline: what the current GoiásScript compiler actually emits (local evidence used by every other section)

### Takeaway
The compiler is a regex-over-text transpiler that prepends a fixed 5,464-byte runtime to every output (92.9% of the bytes of the sample program), routes aliased calls through wrapper methods installed on built-in prototypes, and its advertised JIT/optimizer is a no-op placeholder because the module does not exist. Running the prelude costs well under 1 ms, so the real costs are bytes, steady-state wrapper overhead when an emitted file runs in sloppy mode (plain `node`), realm pollution and semantic bugs, not startup.

### Cited Findings

#### Pipeline and prelude
- `transpile()` rewrites the source text with regular expressions and then does `jsCode = goianoRuntime + '\n\n' + jsCode`, so the runtime is prepended to every output — [simpleTranspiler.js:33-43](../../packages/core/src/compiler/simpleTranspiler.js)
- Only `'...'` and `"..."` strings are shielded from the rewrites (placeholder regex at line 76, restored at lines 199-201); about 50 further regex rules turn JavaScript names into goiano aliases, e.g. `.length` becomes `.tamanho()` (line 235), `.push(` becomes `.empurrar(` (line 244), `Math.random()` becomes `GoianoMath.sorteio()` (line 262), `console.log(` becomes `prosa(` (line 284) — [simpleTranspiler.js:68-289](../../packages/core/src/compiler/simpleTranspiler.js)
- The prelude (`gerarImplementacaoGoiana`) is 246 lines and 5,464 bytes: 37 assignments onto built-in prototypes (13 `String`, 17 `Array`, 1 `Object`, 6 `Date`), 4 `Object.*` statics, a `GoianoMath` object and 10 global functions, all copied onto `globalThis` — [GoianoBuiltins.js:118-365](../../packages/core/src/goianoMethods/GoianoBuiltins.js); counts measured with [hazards.cjs](optimization-evidence/scripts/hazards.cjs) and [baseline-sizes.cjs](optimization-evidence/scripts/baseline-sizes.cjs)
- For the sample `examples/basic/lista-mapeamento.gs` the output is 5,884 bytes (gzip-9 1,699; brotli-11 1,498): 5,464 bytes (92.9%) are prelude and 418 bytes (gzip 258; brotli 243) are user code; the prelude alone is 1,499 B gzip and 1,313 B brotli; the first user line is line 248 of 262 emitted lines — [baseline-sizes.cjs](optimization-evidence/scripts/baseline-sizes.cjs)
- Cost of running the prelude: median 0.269 ms (p90 0.389 ms, first run 0.943 ms) over 300 fresh `vm` contexts — [hazards.cjs](optimization-evidence/scripts/hazards.cjs)

#### Execution paths
- CLI run command: `cli/index.js` calls `compiler.execute(...)`, a method of `class GoiasScriptCompiler` that ends in a direct `eval(compileResult.javascript)`; MDN states that "All parts of a class's body are strict mode code", and the probe confirms the generated code (prelude included) runs strict there: `typeof this` inside a `String.prototype` method called on a primitive is `"string"` — [cli/index.js:136](../../packages/core/src/cli/index.js), [compiler.js:67,281-299](../../packages/core/src/compiler.js), [host-strictness.cjs](optimization-evidence/scripts/host-strictness.cjs), [MDN: strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- Emitted files: none of compiler.js, simpleTranspiler.js, GoianoBuiltins.js or cli/index.js adds a `"use strict"` directive to the output, and the translate/`--output` paths write `resultado.javascript` to disk as-is; the same probe run as a file with plain `node` (CommonJS) prints `"object"`, i.e. sloppy mode — [cli/index.js:125,295](../../packages/core/src/cli/index.js), [host-strictness.cjs](optimization-evidence/scripts/host-strictness.cjs)
- Playground: every run tears down the previous worker and creates a fresh `Worker`, and the worker executes `new Function('console', ...DANGEROUS, '"use strict"; ' + jsCode)`, so the prelude is strict there and is applied to a fresh realm each run — [use-runner.ts:22-44](../../apps/playground/lib/use-runner.ts), [runner.worker.ts:74](../../apps/playground/workers/runner.worker.ts)

#### The optimizer that does not exist
- `NoopJITCompiler.compile(code)` returns its input and `GoianoJITCompiler = loadOptional('./performance/JITCompiler', NoopJITCompiler)`; `packages/core/src` contains only `cli/`, `compiler/`, `errors/`, `goianoMethods/`, an empty `stdlib/`, `browser.js` and `compiler.js` (local `ls -R`), so the fallback is always used; `obterVersaoOtimizada` returns a comment string, not code; `browser.js` says the optional v2 modules (TypeAnalyzer/ModuleResolver/JITCompiler) are left out of the browser build — [compiler.js:41-62](../../packages/core/src/compiler.js), [GoianoBuiltins.js:441-446](../../packages/core/src/goianoMethods/GoianoBuiltins.js), [browser.js:1-4](../../packages/core/src/browser.js)

#### Defects measured in the prelude and in the text rewrites
- `Object.prototype.tem_propriedade = function...` is a plain assignment and therefore enumerable: `for (k in {a:1})` yields `["a","tem_propriedade"]` and `'tem_propriedade' in {}` is `true` — [hazards.cjs](optimization-evidence/scripts/hazards.cjs), [forin-bench.cjs](optimization-evidence/scripts/forin-bench.cjs); MDN: "The for...in statement iterates over all enumerable string properties of an object (ignoring properties keyed by symbols), including inherited enumerable properties" — [MDN for...in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)
- `String.prototype.trocar` builds `new RegExp(buscar, 'g')`: `'a.b.c'.trocar('.', '-')` returns `"-----"` and `'1+1'.trocar('+', '-')` throws `SyntaxError` — [GoianoBuiltins.js:128-130](../../packages/core/src/goianoMethods/GoianoBuiltins.js), [hazards.cjs](optimization-evidence/scripts/hazards.cjs)
- Text rewriting breaks valid programs: `lista.length = 0` becomes `lista.tamanho() = 0` (runtime ReferenceError); `{ length: 3 }.length` becomes `o.tamanho()` (TypeError); a class with its own `map(f)` method called as `.map(` becomes `.mapear(` (TypeError); the regex literal `/\.length\b/` is rewritten inside the literal — [transpile-checks.cjs](optimization-evidence/scripts/transpile-checks.cjs)
- No source map is produced: `transpile()` returns `{ success, code, warnings, tokens }` and the only mention of source maps in `packages/core/src` is the CLI `--source-map` option — [simpleTranspiler.js:48-53](../../packages/core/src/compiler/simpleTranspiler.js), [cli/index.js:38,65,297](../../packages/core/src/cli/index.js)
- Unit tests assert on prelude text (`toContain('empurrar')`, `toContain('GoianoMath.sorteio')`) — [goianoBuiltins.test.js:67,74](../../packages/core/tests/unit/goianoBuiltins.test.js)
- Alias spelling drift: the `metodosGoianos` table (GoianoBuiltins.js:21) is not used by the transpiler's hard-coded regex list, and the CLI help text mentions `.sorteia_um()` and `.bota_no_final()`, which the prelude does not define (it defines `GoianoMath.sorteio`, line 273, and `empurrar`, line 197) — [goias.js:297,363-366,407-408](../../packages/core/bin/goias.js), [GoianoBuiltins.js:21,197,273](../../packages/core/src/goianoMethods/GoianoBuiltins.js)

### Inferences
- Startup is not the bottleneck (0.27 ms median). The case for removing the prelude is bytes (93% of the sample output, which the playground also displays), per-call wrapper cost wherever emitted code runs sloppy (section 3), realm pollution, semantic bugs, readability of the generated JavaScript and testability.
- Because the transpiler is regex-on-text, no AST-level optimization can be correct until a real front end exists; the measured rewrite failures are the same failure class as unsound property renaming (section 3).
- Unit tests that assert on prelude text must become behavioral (differential) tests before the prelude can change (section 6).

### Gaps
- Only one tiny sample program was measured; no corpus of realistic `.gs` programs exists in the repo to weigh prelude share and hot-path patterns.
- The code path of `bin/goiasscript.js` was not traced beyond `execute()` reaching `eval`.
- The transpiler's own run time (about 100 whole-text regex passes) was not measured.

## 1. Which classical optimizations are safe and worthwhile on JavaScript, and is a CFG/SSA IR justified for a small transpiler?

### Takeaway
Classical passes are safe on JavaScript only under explicit assumptions (property reads and coercions are pure, no TDZ violations, no `with` or direct `eval`, built-ins not redefined), which every production optimizer documents. Engines already run CSE, LICM, inlining and DCE with runtime type feedback, so the worthwhile source-level work is constant folding, dead-branch removal, scope-aware constant propagation and above all GoiásScript-specific lowering of aliases; a separate CFG/SSA IR is not justified (esbuild optimizes on the AST in three passes).

### Cited Findings

#### Semantics that bound what is safe
- `==` and `===` treat `NaN` and signed zero specially ("so `NaN != NaN`, and `-0 == +0`"), and `Object.is` distinguishes them — [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)
- Local demonstrations on V8 13.6 (the semantics are specified, not engine-specific): `-0 + 0` is `0` and `-5 * 0` is `-0` and `NaN * 0` is `NaN` (so `x + 0` to `x` and `x * 0` to `0` are invalid); `NaN < 1` is `false` while `!(NaN >= 1)` is `true` (negating a comparison is invalid); `"3" * 1` is the number 3 (`x * 1` to `x` needs a Number); an unused `o + 1` still ran `valueOf`; two reads of `g.a` ran the getter twice (CSE of property reads changes behavior); a `let` read before initialization throws `ReferenceError` — [semantics.cjs](optimization-evidence/scripts/semantics.cjs)
- `(2**31) << 1` is 0 while `2**31 * 2` is 4294967296, and `5 >> 1` is 2 while `5 / 2` is 2.5 (doubling and halving cannot become shifts); `0.1+0.2+0.3` is 0.6000000000000001 while `0.1+(0.2+0.3)` is 0.6 (no float reassociation) — [semantics2.cjs](optimization-evidence/scripts/semantics2.cjs)
- ECMA-262 describes the result of `**` as an "implementation-approximated value representing the result of raising base to the exponent power" — [ECMA-262](https://tc39.es/ecma262/); local result: 0 mismatches in 5,000,000 random doubles in [0, 1000) for `x**2` versus `x*x` and for `x**0.5` versus `Math.sqrt(x)` on V8 13.6 (one engine and one range, so not evidence of equivalence elsewhere) — [semantics.cjs](optimization-evidence/scripts/semantics.cjs)
- Terser keeps `unsafe_math` off by default ("optimize numerical expressions like `2 * x * 3` into `6 * x`, which may give imprecise floating point results") and `unsafe_comps` off ("Reverse `<` and `<=` to `>` and `>=` to allow improved compression") — [Terser options](https://terser.org/docs/options/)

#### What engines already do
- Engines perform dead code elimination ("DCE tries to eliminate operations that have no observable effect on the rest of the program execution"), loop-invariant code motion ("This optimization identifies expressions that produce the same value on all loop iterations and hoists them out of the loop") and constant propagation, which is why naive microbenchmarks mislead; the post is from 2012 (Crankshaft era) — [Vyacheslav Egorov: microbenchmarks fairy tale](https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html)
- Maglev builds a CFG-based SSA graph and uses collected feedback to "generate specialized SSA nodes for the types observed" — [V8: Maglev](https://v8.dev/blog/maglev)

#### IR versus AST evidence
- esbuild: "There are currently only three full-AST passes in esbuild" (lexing, parsing, scope setup and symbol declaration; symbol binding, constant folding, syntax lowering and syntax mangling; printing and source map generation) and the rule "Try to do as few full-AST passes as possible for better cache locality"; the document describes an AST plus symbol tables and no separate IR — [esbuild architecture](https://raw.githubusercontent.com/evanw/esbuild/main/docs/architecture.md)
- Closure's flow-sensitive inlining is built on reaching-definition analyses: "There is exactly one reaching definition at the use of that variable", "There is exactly one use for that definition of the variable", and "Currently this pass does not operate on the global scope due to compilation time" — [FlowSensitiveInlineVariables.java](https://raw.githubusercontent.com/google/closure-compiler/master/src/com/google/javascript/jscomp/FlowSensitiveInlineVariables.java)
- Hermes, a full engine compiler, uses an SSA IR in which source variables are storage units: "The only instructions that can access the storage values (Variable and AllocStack) are the Load and Store instructions", and variables captured by closures live in heap scopes — [Hermes IR](https://raw.githubusercontent.com/facebook/hermes/main/doc/IR.md)
- V8 moved TurboFan's backend from Sea of Nodes to the CFG-based Turboshaft: "Sea of Nodes suffers on average from about 3 times more L1 dcache misses compared to our new CFG IR", "compile time got divided by 2 compared to SoN", and the JS frontend is being replaced "by Maglev, another CFG-based IR" (post dated 2025-03) — [V8: Land ahoy, leaving the Sea of Nodes](https://v8.dev/blog/leaving-the-sea-of-nodes), [V8 blog index](https://v8.dev/blog)
- TAJS is "a dataflow analysis for JavaScript that infers type information and call graphs"; its README says the DOM, browser and native-library models are "not 100% complete", lists a handling of `eval` ("Remedying the Eval that Men Do", ISSTA 2012) and offers an option to "enable unsound assumption X" — [TAJS](https://github.com/cs-au-dk/TAJS)

#### Footprint of AST tooling (local `npm pack`, 2026-10-13)
- acorn 8.19.0 `dist/acorn.js` 246,643 B (58,198 gzip; 47,543 brotli); meriyah 7.4.0 UMD 325,706 B (45,552; 36,996); @babel/parser 8.0.7 `lib/index.js` 481,458 B (91,492; 71,085); oxc-parser 0.154.0 `parser.wasm32-wasip1.wasm` 1,470,825 B (483,739; 340,917); astring 1.9.0 `dist/astring.mjs` 35,359 B (7,015; 6,134) — [sizes.mjs](optimization-evidence/scripts/sizes.mjs)

### Inferences
- Per-pass verdict for GoiásScript output (derived from the findings above):

| Pass | Safe when | Worth doing at source level |
|---|---|---|
| Constant folding of literal-only expressions | operands are literals and the folder implements JS semantics exactly (coercions, NaN, signed zero) | Yes, cheap; mostly a size win because engines fold too |
| Constant propagation of `const` bindings holding primitives | scope analysis shows no `eval`/`with` and no TDZ-dependent reads | Yes, it unlocks dead-branch removal |
| Dead-branch and unreachable-code removal | always (after folding) | Yes |
| Removal of unused declarations | initializer is provably pure (literal, function expression); calls, `new`, property reads and coercions are not pure by default | Modest; delegate to a minifier |
| Function inlining | single definition, no dependence on `arguments`, `this`, `.name`, `.length` or `toString`, no recursion | Delegate to a minifier or the engine |
| CSE and copy propagation of property reads | only if getters are assumed pure (the demo shows getters running twice) | No; engines do it with guards |
| LICM | needs alias and purity facts the source does not carry | No; engines do it, and `.length` in a loop is negligible |
| Strength reduction | only exact IEEE identities; `x**2` to `x*x` is not guaranteed by the spec, shifts and reassociation are invalid | No |
| Peephole rewrites (`void 0`, boolean folding) | always | Size only; delegate |
| Alias lowering and prelude pruning (GoiásScript-specific) | closed-world conditions of section 3 | Highest return; no generic tool can do it |

- A separate CFG/SSA IR is not justified at this scale: there is no runtime feedback to specialize on, JavaScript variables behave like memory (closures, `eval`) so SSA needs escape analysis before it pays (Hermes models them as storage), engines redo the dynamic work anyway, and the one small-footprint optimizer with documented architecture (esbuild) works on the AST in three passes.
- A workable pipeline is: front end that yields a real AST with scopes (the dialect is not valid JavaScript, so a keyword-normalizing step is needed before any of the parsers above), visitor passes for folding, propagation, dead-branch removal and alias lowering, a printer with a source map, and an optional external minifier (section 2).

### Gaps
- No source found that quantifies the steady-state benefit of source-level CSE, LICM or inlining on modern engines; the Maglev and 2012 posts only imply that engines do these themselves.
- The textbooks named in the brief (Cooper and Torczon; Muchnick) were not consulted (no accessible text), and no partial-evaluation literature beyond Prepack (section 2) was retrieved; TAJS's README lists three papers but not its original 2009 paper.
- No documentation was retrieved for the internal representation of Terser, SWC or oxc; only esbuild's architecture document was found.
- The repo's `compiler/lexer.js` was not read, so whether it can supply the keyword-normalizing front end is unknown.

## 2. What do Closure, Terser, esbuild, SWC, oxc, Rollup and Prepack assume, and which can be embedded in Node and the browser (size and speed)?

### Takeaway
Every production optimizer documents closed-world style assumptions; none can remove the prelude's prototype assignments (all five embeddable minifiers shrank the 5,884-byte sample by only about 29%, to 4.15-4.18 KB). For embedding, oxc-minify (737 KB brotli WASM; 1.4 ms warm in WASM on a 5.9 KB input) is smallest and fastest but self-describes as alpha, Terser is pure JavaScript (168 KB brotli, 33 ms warm), esbuild-wasm and SWC-wasm cost 3-4 MB brotli, while Closure (46 MB native binary or Java) and Prepack (archived 2022) are not suitable.

### Cited Findings

#### Closure Compiler
- Levels: SIMPLE_OPTIMIZATIONS renames local variables and parameters and preserves functionality "provided that the code does not access local variables using string names"; ADVANCED_OPTIMIZATIONS "also renames global variables, function names, and properties", "removes code that is provably unreachable", and "only inlines functions when it determines that inlining is safe and saves space"; "If your code does not conform to those assumptions, ADVANCED_OPTIMIZATIONS will produce code that does not run"; "If you do not flag external functions and properties referenced in your code, Closure Compiler will inappropriately rename references in your code, causing mismatches" — [Closure compilation levels](https://developers.google.com/closure/compiler/docs/compilation_levels)
- The README says "Compilation modes other than ADVANCED were always an afterthought and we have deprecated those modes", which conflicts with the levels page that still documents SIMPLE_OPTIMIZATIONS as the default; it also says "The NPM packages are not built and distributed by Google" — [closure-compiler README](https://raw.githubusercontent.com/google/closure-compiler/master/README.md), [compilation levels](https://developers.google.com/closure/compiler/docs/compilation_levels)
- Its assumptions page includes "Property reads are assumed to be side effect free" and "toString and valueOf are assumed to be side-effect free"; it also assumes the standard built-ins are not redefined and that `Function.length` may not be preserved — [Closure compiler assumptions](https://github.com/google/closure-compiler/wiki/Compiler-Assumptions)
- Distribution: the main README says the npm package "will provide programmatic access to the native Graal binary in most cases, and will fall back to the Java version otherwise" — [closure-compiler README](https://raw.githubusercontent.com/google/closure-compiler/master/README.md); the JavaScript port repository was archived on Jun 14, 2024 with the note "This package is now deprecated. Distribution of the JavaScript version has been moved to the main npm distribution" — [closure-compiler-js](https://github.com/google/closure-compiler-js); local: the last `google-closure-compiler-js` release is 20200719.0.0 (`jscomp.js` 4,066,258 B) and `google-closure-compiler-linux` 20261011.0.0 ships a 46,335,032 B binary — [sizes.mjs](optimization-evidence/scripts/sizes.mjs)

#### Terser
- Defaults relevant to semantics: `pure_getters` `"strict"` ("treat `foo.bar` as side-effect-free only when `foo` is certain to not throw"), every `unsafe*` option `false`, `passes` 1, `reduce_vars` true, `collapse_vars` true ("side effects permitting"), `inline` true, `side_effects` true, `toplevel` false ("drop unreferenced functions"), `pure_funcs` null ("DANGER: will not check if the name is redefined in scope"), `pure_new` false, `ecma` 5 ("Pass 2015 or greater to enable compress options that will transform ES5 code into smaller ES6+ equivalent forms") — [Terser options](https://terser.org/docs/options/)

#### esbuild
- "Minification is not safe for 100% of all JavaScript code"; the minifier removes whitespace, rewrites syntax and renames locals — [esbuild API: minify](https://esbuild.github.io/api/#minify)
- "The side effect detection used for tree shaking is conservative"; "tree shaking works with ECMAScript modules but not with CommonJS modules"; `/* @__PURE__ */` can only precede a call or `new` expression; ignoring annotations means esbuild "will no longer respect `/* @__PURE__ */` comments or the `sideEffects` field" — [esbuild API](https://esbuild.github.io/api/)
- `drop` ("Using this flag can introduce bugs into your code") and `mangle-props` ("Using this feature can break your code in subtle ways", and "It also only works if you do not under any circumstances reference a mangled property indirectly") — [esbuild API](https://esbuild.github.io/api/)
- `target` lowers syntax only: "Note that this is only concerned with syntax features, not APIs" — [esbuild API: target](https://esbuild.github.io/api/#target)
- A direct `eval` means "none of that code will be eliminated as dead code and none of that code will be minified", and "The value of `toString()` is not preserved on functions (and classes)" — [esbuild content types: JavaScript caveats](https://esbuild.github.io/content-types/#javascript-caveats)

#### SWC
- Minifier options mirror Terser's, with different defaults: `compress.toplevel` defaults to true (Terser: false) and `mangle.topLevel` also defaults to true, `passes` defaults to 0 meaning "no limit" (Terser: 1), `ecma` defaults to 5, all `unsafe*` options default to false; `minifySync` exists on `@swc/core`, `@swc/wasm` and `@swc/wasm-web` — [SWC minification docs](https://swc.rs/docs/configuration/minification)

#### oxc
- The docs describe a "high-performance minifier that shrinks your code by removing unused code and transforming to a shorter equivalent" and say it "makes some assumptions about your code"; Rolldown uses `oxc-minify` by default — [oxc minifier usage](https://oxc.rs/docs/guide/usage/minifier.html)
- Core assumptions (held regardless of options) include: built-ins "behave as specified in ECMAScript" (the example forbids `Array.prototype.push = ...`), no `document.all`, no `with`, `toString`/`valueOf`/`Symbol.toPrimitive` have no side effects, no TDZ violations, no reliance on `Function.prototype.toString()`; optional assumptions apply when property mangling is on ("code does not access selected properties through an arbitrary runtime string") or function/class names are not preserved — [oxc minifier assumptions](https://raw.githubusercontent.com/oxc-project/oxc/main/crates/oxc_minifier/docs/ASSUMPTIONS.md)
- The `oxc-minify` README (0.154.0) says "This is alpha software and may yield incorrect results", that it "assumes the input code is semantically correct" and uses the parser's fast mode, and that it "still lacks a few key minification techniques such as constant inlining and dead code removal", which conflicts with the docs page that lists "Eliminate dead code" (the README text looks stale) — [oxc-minify package README](https://www.npmjs.com/package/oxc-minify), [oxc minifier usage](https://oxc.rs/docs/guide/usage/minifier.html)

#### Rollup and Prepack
- Rollup tree-shaking is ESM-based and assumption-driven: `treeshake.propertyReadSideEffects` defaults to true (retain reads that may run getters), `tryCatchDeoptimization` true ("Rollup will by default deactivate tree-shaking inside try-statements"), `unknownGlobalSideEffects` true, `correctVarValueBeforeDeclaration` false ("Rollup may incorrectly assume that variable is constant throughout the program"), and the `smallest` preset keeps "getters with side effects" only "if the return value is used" and warns "you should not bundle polyfills that rely on detecting broken builtins" — [Rollup treeshake options](https://rollupjs.org/configuration-options/#treeshake)
- Prepack: "Prepack is a partial evaluator for JavaScript"; the repository "was archived by the owner on Feb 12, 2022", and the only reason given is that the team has "temporarily set down work on Prepack" to prioritize other projects — [Prepack README](https://github.com/facebookarchive/prepack)

#### Third-party benchmark (privatenumber/minification-benchmarks, updated 2026-10-10)
- Versions listed: oxc-minify 0.153.0, @swc/core 1.16.13, terser 5.51.2, esbuild 0.28.2, google-closure-compiler 20251216.0.0; each minifier runs in its own process with a 10 s timeout, artifact integrity is verified by a test before and after minification, and times are averages of 5 runs; Closure timed out (above 10 s) on some of the largest artifacts — [minification-benchmarks](https://github.com/privatenumber/minification-benchmarks)

| Tool | react 17.0.2 (72 KB) | three 0.124.0 (1.25 MB) | lodash 4.17.21 (544 KB) |
|---|---|---|---|
| oxc-minify | 3 ms, 8.35 KB gzip | 49 ms, 159.84 KB | 12 ms, 25.83 KB |
| esbuild | 12 ms, 8.54 KB | 53 ms, 163.75 KB | 18 ms, 26.20 KB |
| @swc/core | 18 ms, 8.19 KB | 173 ms, 158.70 KB | 46 ms, 25.26 KB |
| terser | 118 ms, 8.26 KB | 1,560 ms, 159.17 KB | 470 ms, 25.15 KB |
| uglify-js | 420 ms, 8.18 KB | 4,320 ms, 159.07 KB | 1,394 ms, 24.69 KB |
| google-closure-compiler | 3,169 ms, 8.22 KB | 7,766 ms, 162.81 KB | 4,283 ms, 25.03 KB |

#### Local measurement on the real emitted JavaScript (input 5,884 B; gzip-9 1,699; brotli-11 1,498)
- Default options (`compress` plus `mangle`), one cold process per tool, "first call" includes one-time initialization, "warm" is the median of 30 calls — [minifier-bench-run.mjs](optimization-evidence/scripts/minifier-bench-run.mjs), [oxc-wasm-run.mjs](optimization-evidence/scripts/oxc-wasm-run.mjs)

| Tool (API) | Output B | gzip-9 | brotli-11 | First call ms | Warm median ms |
|---|---|---|---|---|---|
| terser 5.51.2 (pure JS) | 4,166 | 1,158 | 1,043 | 162 | 33.0 |
| uglify-js 3.19.3 (pure JS) | 4,150 | 1,159 | 1,050 | 171 | 48.7 |
| esbuild 0.28.2 native (`transformSync`) | 4,175 | 1,165 | 1,049 | 143 | 3.4 |
| esbuild-wasm 0.28.2 (`transform`) | 4,175 | 1,165 | 1,049 | 831 | 30.6 |
| oxc-minify 0.154.0 native binding | 4,158 | 1,160 | 1,041 | 8.2 and 11.4 (two sessions) | 0.30 and 0.17 |
| oxc-minify 0.154.0 WASM binding (Node WASI) | 4,158 | 1,160 | not measured | 26.0 | 1.38 |
| @swc/core 1.16.x native (`minifySync`) | 4,168 | 1,154 | 1,042 | 7.0 | 1.53 |
| @swc/wasm 1.16.18 (`minifySync`) | 4,168 | 1,154 | 1,042 | 219 | 7.6 |

- The 418-byte user-only part minifies to 278-297 B across the same tools (gzip 197-203), so the five tools differ by under 1% on size — [minifier-bench-run.mjs](optimization-evidence/scripts/minifier-bench-run.mjs)

#### Package footprint (local `npm pack`, 2026-10-13)

| Package at version | Artifact | Raw B | gzip-9 B | brotli B |
|---|---|---|---|---|
| oxc-minify 0.154.0 | `minify.wasm32-wasip1.wasm` | 3,179,245 | 1,121,539 | 737,370 |
| @oxc-minify/binding-linux-x64-gnu 0.154.0 | native `.node` | 4,402,968 | 1,829,901 | 1,372,771 |
| esbuild-wasm 0.28.2 | `esbuild.wasm` | 13,978,850 | 3,754,952 | 3,081,092 (q8) |
| esbuild-wasm 0.28.2 | `lib/browser.js` | 133,484 | 24,130 | 19,619 |
| @esbuild/linux-x64 0.28.2 | native binary | 11,427,952 | 4,741,207 | 4,192,127 (q8) |
| @swc/wasm-web 1.16.18 | `wasm_bg.wasm` | 18,019,819 | 5,367,147 | 3,877,677 (q8) |
| @swc/core-linux-x64-gnu 1.16.18 | native `.node` | 10,663,336 | 10,277,655 | 10,258,098 (q8) |
| terser 5.51.2 | `dist/bundle.min.js` | 1,104,314 | 213,282 | 167,982 |
| uglify-js 3.19.3 | `lib/compress.js` (largest of several files) | 654,452 | 101,516 | 78,559 |
| @rollup/browser 4.64.6 | `bindings_wasm_bg.wasm` (JS part not measured) | 582,868 | 251,010 | 204,126 |
| @babel/standalone 8.0.7 | `babel.min.js` | 2,342,327 | 544,873 | 370,255 |
| google-closure-compiler-js 20200719.0.0 (deprecated) | `jscomp.js` | 4,066,258 | 968,805 | 715,271 |
| google-closure-compiler-linux 20261011.0.0 | native `compiler` | 46,335,032 | 16,134,961 | 13,888,126 (q8) |

Measured with [sizes.mjs](optimization-evidence/scripts/sizes.mjs). Unpacked package totals: terser 2,354,204 B, uglify-js 1,304,556 B, oxc-minify WASM binding tarball 3,235,198 B, esbuild-wasm 14,532,821 B, @swc/wasm-web 18,123,628 B.

- Embedding facts: Terser documents browser loading that "exposes a global variable `Terser` containing a `.minify` property" — [Terser README](https://github.com/terser/terser); `esbuild-wasm` is "the cross-platform WebAssembly binary for esbuild" — [esbuild-wasm on npm](https://www.npmjs.com/package/esbuild-wasm); `oxc-minify` 0.154.0 declares `browser`, `./wasm` and `./workerd` entry points — [oxc-minify on npm](https://www.npmjs.com/package/oxc-minify)

### Inferences
- On a roughly 6 KB output, compression ratios converge (4,150-4,175 B), so the choice is driven by integration cost and robustness, not size.
- Candidate matrix for GoiásScript: playground (WASM) is oxc-minify (737 KB brotli, 1.4 ms warm) or Terser (168 KB brotli, 33 ms warm, no WASM); Node CLI is Terser for a dependency-free pure-JS install, or native oxc/esbuild/SWC where platform binaries are acceptable. Because oxc is alpha, pair it with the differential tests of section 6. Closure ADVANCED and Prepack are poor fits.
- Minifiers cannot remove `X.prototype.y = ...` statements (side effects), which the measurement confirms; pruning the prelude and lowering aliases has to be done by the GoiásScript compiler itself (section 3).
- oxc's "no monkey-patching" assumption is about changing the behavior of built-ins; adding new non-conflicting methods does not violate it, but the enumerable `Object.prototype` addition changes `for...in` semantics, which is outside what any listed assumption covers.
- oxc's fast-parse mode assumes semantically valid input, so a parse check (for example `new vm.Script(code)` or acorn) should run before minification, given that the regex transpiler can emit invalid code.
- Minify only in an opt-in export mode; the playground shows the generated JavaScript (`js` is returned by the worker), so readable output should stay the default there.

### Gaps
- No in-browser measurement was made; WASM numbers are from Node's V8, not a browser.
- Tool options were left at defaults (`ecma` 5; no `passes` tuning; no `toplevel` for Terser), so sizes with `ecma: 2022` or `module` mode are untested.
- No benchmark of the runtime speed of minified output was run.
- oxc-transform (the transformer) was not researched, only oxc-minify; the oxc docs do not state strict-mode or getter assumptions.
- The technical reasons for Prepack's archival were not found in any primary source (only "other priorities"); the SIMPLE mode's future in Closure is unclear (README versus docs).
- Closure Compiler's `google-closure-compiler-js` deprecation was read from the repository and README, not from an npm registry deprecation flag.

## 3. Runtime strategy for dialect aliases: prototype monkey-patching, compile-time rewriting or imported helpers

### Takeaway
Compile-time rewriting to native operations is the only zero-cost strategy, but it is exact only under a closed-world assumption about receivers and property names (the same assumption property-mangling optimizers document). Monkey-patching measured badly here: sloppy-mode wrappers on primitives (the plain-`node` case for emitted files; the playground and CLI `execute()` evaluate strictly) ran 6.7-8.0x slower than `.length`, an enumerable `Object.prototype` property made `for...in` 11-18x slower and wrong, and patching after warm-up invalidated optimized code. Imported pruned helpers (tslib/core-js-pure style) are safe and tree-shakable but share one inline cache across all receivers. A tiered hybrid is recommended.

### Cited Findings

#### Strategy 1: prototype monkey-patching
- MDN: monkey patching "risks forward compatibility, because if the language adds this method in the future but with a different signature, your code will break", it led to incidents like SmooshGate, and "The only good reason for extending a built-in prototype is to backport the features of newer JavaScript engines" — [MDN: inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- SmooshGate: MooTools copied array methods with `for (var key in Array.prototype)`; "for-in iterates over 'enumerable' properties, which doesn't include native methods like Array.prototype.sort, but it does include regularly-assigned properties like Array.prototype.foo = whatever", so a native `flatten` stopped being copied; "During the May 2018 TC39 meeting, #SmooshGate was officially resolved by renaming flatten to flat"; the advice is "Don't modify objects you don't own!" — [Chrome blog: SmooshGate](https://developer.chrome.com/blog/smooshgate)
- V8 caches prototype lookups with validity cells: "This ValidityCell is invalidated whenever someone changes the associated prototype or any prototype above it"; modifying `Object.prototype` means "throwing performance out the window"; the summary is "Leave your prototypes alone!", and if prototypes must change, do it before other code runs — [Mathias Bynens: prototypes](https://mathiasbynens.be/notes/prototypes)
- Local `--trace-deopt` experiment: after warm-up, adding `Array.prototype.mapear` produced five `marking dependent code ... for deoptimization, reason: dependent prototype chain changed` events covering TURBOFAN_JS and MAGLEV code of both the hot loop and the function calling `.map`, while patching before any hot code ran produced none; adding an enumerable `Object.prototype` property afterwards produced no further such events in this run — [deopt-late.cjs](optimization-evidence/scripts/deopt-late.cjs), [deopt-early.cjs](optimization-evidence/scripts/deopt-early.cjs)
- Local mitata A/B (256 string reads per iteration; both wrappers created via `new Function`, only `"use strict"` differs; three runs): `str.length` 293.8, 485.0, 451.8 ns; sloppy `str.tamanho()` 2,350, 3,230, 3,170 ns (8.0x, 6.7x, 7.0x slower); strict `str.tamanho()` 442.5, 521.2, 454.3 ns (1.5x, 1.07x, 1.01x) — [sloppy-vs-strict-ab.cjs](optimization-evidence/scripts/sloppy-vs-strict-ab.cjs); an earlier run measured 7.7x — [alias-bench.cjs](optimization-evidence/scripts/alias-bench.cjs)
- Mechanism: for a sloppy function "`this` is always an object ... the boxed value of `this`, if called with a primitive as `this`", while strict mode does not box — [MDN: strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- Where the penalty applies: the playground (`"use strict"` prefix) and the CLI `execute()` path (direct eval inside a class method) run the prelude strictly, so only emitted `.js` files run by plain `node` (CommonJS, no directive) pay the sloppy-mode cost — [host-strictness.cjs](optimization-evidence/scripts/host-strictness.cjs)
- For arrays the sloppy and strict `mapear` wrappers were indistinguishable from native `map` in three A/B runs (`map` 58.3/47.7/54.3 ns; sloppy 42.6/44.7/71.6; strict 46.4/46.2/87.1); the first `alias-bench.cjs` run showed sloppy `mapear` at 87.8 ns versus 37.1 ns for `map`, which did not reproduce; a rest/spread `empurrar` wrapper matched native `push` within noise (286.6 versus 287.8 ns for 64 pushes) — [sloppy-vs-strict-ab.cjs](optimization-evidence/scripts/sloppy-vs-strict-ab.cjs), [alias-bench.cjs](optimization-evidence/scripts/alias-bench.cjs)
- Local `for...in` benchmark, one fresh process per mode, two interleaved repetitions, 4-key object: clean 12.75 and 15.52 ns; the prelude's enumerable assignment 137.68 and 273.94 ns (about 11x and 18x slower); `Object.defineProperty(..., {enumerable: false})` 11.85 and 18.57 ns; `Object.keys(o).length` was unaffected — [forin-bench.cjs](optimization-evidence/scripts/forin-bench.cjs)

#### Strategy 2: compile-time rewriting to native operations
- Closure ADVANCED renames properties and requires externs for anything external, otherwise it "will inappropriately rename references in your code" — [Closure compilation levels](https://developers.google.com/closure/compiler/docs/compilation_levels)
- esbuild's property mangling "only works if you do not under any circumstances reference a mangled property indirectly", and oxc's optional assumption is that "code does not access selected properties through an arbitrary runtime string" — [esbuild API](https://esbuild.github.io/api/), [oxc assumptions](https://raw.githubusercontent.com/oxc-project/oxc/main/crates/oxc_minifier/docs/ASSUMPTIONS.md)
- The current regex rewrite fails exactly on the cases a closed-world check must catch (assigning `.length`, an object with its own `length`, a user method named `map`, regex literals) — [transpile-checks.cjs](optimization-evidence/scripts/transpile-checks.cjs)
- The language already has type annotations (`texto`, `numero`, `lista`, `coisa`) that the transpiler strips with a regex — [CLAUDE.md](../../CLAUDE.md), [simpleTranspiler.js:210-214](../../packages/core/src/compiler/simpleTranspiler.js)

#### Strategy 3: imported, tree-shakable helpers
- TypeScript: "By default, these helpers are inserted into files which use them. This can result in code duplication if the same helper is used in many different modules", and with `importHelpers` "these helper functions are instead imported from the tslib module" — [TypeScript tsconfig: importHelpers](https://www.typescriptlang.org/tsconfig/#importHelpers)
- Babel's transform-runtime: helpers "will be added to every file that requires it" by default and can instead "reference the module `@babel/runtime` to avoid duplication"; the `corejs` option "has been removed in Babel 8" — [Babel transform-runtime](https://babeljs.io/docs/babel-plugin-transform-runtime)
- core-js-pure is "a version without global namespace pollution", used as plain functions (for example `flatMap([1, 2], it => [it, it])`) instead of methods — [core-js-pure README](https://unpkg.com/core-js-pure@3/README.md)
- Tree shaking needs ES modules and is conservative: "tree shaking works with ECMAScript modules but not with CommonJS modules"; "The side effect detection used for tree shaking is conservative" — [esbuild API](https://esbuild.github.io/api/); local result: every minifier left the prelude almost intact (5,884 B to about 4.16 KB) — [minifier-bench-run.mjs](optimization-evidence/scripts/minifier-bench-run.mjs)
- Inline-cache sharing: V8 caches up to 4 shapes per property-load site before going megamorphic, megamorphic ICs "probe global hash table and thus are slowest among ICs", and a helper used with many shapes or function targets stops being specialized — [Vyacheslav Egorov: what's up with monomorphism](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html); the polymorphic limit still defaults to 4 in V8 13.6 (`--max-valid-polymorphic-map-count`, local `node --v8-options`)
- Local result: an imported helper `mapearHelper(arr, f)` measured 26.3 ns versus 37.1 ns for the direct native call, which cannot be a real advantage (it only calls `a.map`), so differences at this scale are noise; the benchmark used one receiver type and therefore cannot show the megamorphism hazard — [alias-bench.cjs](optimization-evidence/scripts/alias-bench.cjs)

### Inferences
- Comparison (derived from the findings above):

| Criterion | 1. Prototype patching (today) | 2. Compile-time rewrite to native | 3. Imported pruned helpers |
|---|---|---|---|
| User-defined member with the same name | clobbers or is shadowed; wrappers are not always 1:1 (`trocar`) | silently bypassed unless names are reserved or declarations are detected | can dispatch to the user's member first, then fall back to native |
| Engine performance | sloppy wrapper on primitives about 7x slower (emitted files under plain `node`); late patching invalidates optimized code; enumerable additions slow `for...in` 11-18x | native speed; per-site feedback stays in user code | extra call; one shared IC per helper sees every receiver shape (megamorphism risk) |
| Output size | fixed 5.4 KB | 0 B | proportional to aliases used |
| Interop and safety | pollutes the realm (SmooshGate class of problems), visible to all code | none | none (pure functions) |
| Tree-shaking | impossible (side effects) | not applicable | possible (pure declarations, ESM or per-file emission) |
| Debuggability | extra frames, prelude shifts line numbers by 247 | output reads like ordinary JavaScript | extra frames; helper range can be hidden via source-map `ignoreList` (section 5) |

- Recommended hybrid, tiered per call site: (a) if the alias name is not declared anywhere in the compilation unit (object keys, class members, assignments, `defineProperty` literals) and the receiver is not reached through dynamic `obj[expr]`, or if an annotation proves the receiver type, rewrite to the native operation (`x.mapear(f)` to `x.map(f)`, `.tamanho()` to `.length`); (b) otherwise call a helper emitted only if used, dispatching to a user-defined member first; (c) never patch built-in prototypes in the default mode.
- If a REPL or interop mode keeps patching, do it once before user code, with `defineProperty` non-enumerable members, in strict mode, and never on `Object.prototype`.
- Reserve the alias names and report a compile error (in goianês) when user code declares one, or fall back to the helper for that unit.
- Make the alias table a single data source (the existing `metodosGoianos` table) that generates rewrite rules, helpers, docs, CLI help and the VS Code grammar; the current repo has at least two spellings for push and for random.
- Avoid one generic dispatcher such as `__call(obj, 'name', ...)`; emit one helper per alias so each keeps its own inline cache.
- Do not trust single microbenchmark ratios below about 1.5x at roughly 40 ns per iteration (section 6).

### Gaps
- Only V8 was measured; no data for JavaScriptCore or SpiderMonkey prototype-patching behavior.
- The mechanism behind the `for...in` slowdown was not established from a primary source; only the measured effect and the specified semantics are cited.
- No benchmark with polymorphic helper use was run, so the megamorphism cost of helpers is inferred from the cited article (a 2015 post on V8 internals), not measured.
- No data on how often real GoiásScript programs define members named like aliases.
- The SmooshGate page's own "last updated" stamp (2018-03-19) predates the May 2018 meeting it describes, so its dates are approximate.
- The 2017 V8 change related to deleting properties (section 4) shows engine internals shift; the prototype-invalidation behavior shown here is specific to V8 13.6.

## 4. JavaScript engine performance principles for generated code (2026) and advice that no longer applies

### Takeaway
The durable principles are shared by V8, JavaScriptCore and SpiderMonkey: keep object shapes stable and call sites monomorphic, avoid dictionary-mode objects, use strict mode, do not mutate prototypes after warm-up, and keep variable types stable. Several older tips are obsolete (try/catch deopts from the Crankshaft era, arity matching after the arguments adaptor frame was removed, Sea-of-Nodes internals), and I found no evidence supporting array-join over concatenation for string building.

### Cited Findings

#### Shapes, inline caches and tiers (cross-engine)
- V8 names shapes "HiddenClasses" (Maps): "Objects with the same structure (same properties in the same order) have the same HiddenClass", "By default every new named property added causes a new HiddenClass to be created", in-object properties are "the fastest properties available in V8", and "Since inline caches don't work with dictionary properties, the latter, are typically slower than fast properties"; "Adding array-indexed properties does not create new HiddenClasses" and "Array functions perform considerably slower on objects with slow elements" — [V8: fast properties](https://v8.dev/blog/fast-properties)
- All major engines use shapes ("V8 calls them Maps", "JavaScriptCore calls them Structures", "SpiderMonkey calls them Shapes"); "ICs are the key ingredient to making JavaScript run fast"; advice: "Always initialize your objects in the same way, so they don't end up having different shapes" and "Avoid `Object.defineProperty` on array indices!" — [Mathias Bynens: shapes and ICs](https://mathiasbynens.be/notes/shapes-ics)
- IC states: monomorphic is "the fastest possible IC state if you hit the cache all the time", megamorphic ICs "probe global hash table and thus are slowest among ICs", "worrying about polymorphism is usually futile" without realistic benchmarks (2015 post; the V8 13.6 polymorphic-map default is still 4 locally) — [Vyacheslav Egorov](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html)
- JavaScriptCore "embraces the idea of tiering and has four tiers" and "Inline caches are our most powerful profiling source" — [WebKit: speculation in JavaScriptCore](https://webkit.org/blog/10308/speculation-in-javascriptcore/)
- SpiderMonkey's optimizing JIT (Warp) relies "solely on CacheIR data collected by the baseline tiers", and "If these assumptions turn out to be wrong, the optimized code is discarded"; a maintainer comment gives thresholds of "100 for Baseline JIT, roughly 1500 for Warp" (2020) — [Mozilla Hacks: Warp](https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/)
- V8 tiers: Ignition, Sparkplug, Maglev (shipped in Chrome M117; about 10x slower to compile than Sparkplug and 10x faster than TurboFan; SSA on a CFG "rather than TurboFan's more flexible but cache unfriendly sea-of-nodes representation") and TurboFan — [V8: Maglev](https://v8.dev/blog/maglev); TurboFan's whole JS backend now uses Turboshaft and its frontend is being replaced by Maglev — [V8: leaving the Sea of Nodes](https://v8.dev/blog/leaving-the-sea-of-nodes)
- Node 24's V8 13.6 exposes `--maglev`, `--sparkplug`, `--turbofan` and `--turbolev` ("Maglev + Turboshaft combined as the 4th tier compiler instead of Turbofan") — local `node --v8-options`; the V8 blog index fetched lists no post dated after 2025-08 — [V8 blog](https://v8.dev/blog)

#### Objects, calls and scopes
- `delete`: on V8 13.6 the object left fast mode in all four variants tested (literal, assigned and class-instance objects; last-added and first property), while assigning `undefined` kept it fast — [delete-fast-props.cjs](optimization-evidence/scripts/delete-fast-props.cjs); a 2017 V8 change tried to roll back the last map transition when the last-added property is deleted and was described as "a performance experiment" in a revert — [Chromium code review 2843473002](https://codereview.chromium.org/2843473002)
- Arguments adaptor frame: V8 removed the special machinery for argument-count mismatches (V8 v8.9, article dated 2021-02), with an 11.2% improvement in Ignition and "up to 40% speedup" in a micro-benchmark "designed to maximise the impact of the arguments adaptor frame" — [V8: faster JavaScript calls](https://v8.dev/blog/adaptor-frame)
- Strict mode: "strict mode code can sometimes be made to run faster than identical code that's not strict mode"; "Many compiler optimizations rely on the ability to say that variable X is stored in that location"; `arguments.callee` "substantially hinders optimizations like inlining functions"; modules are automatically strict — [MDN: strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- Closures: "VMs for languages with lexical closures allocate variables referenced from inner functions on the heap, in a structure called a 'context'", while locals sit on the stack — [V8: preparser](https://v8.dev/blog/preparser)
- Numbers: updating a numeric slot in a script context allocated a new `HeapNumber` each time; mutable heap numbers gave "2.5x" on the async-fs benchmark and about 1.6% on JetStream2, and "the stability of the type stored in the slot is crucial for maintaining peak performance" — [V8: mutable heap numbers](https://v8.dev/blog/mutable-heap-number)
- Strings: "The ConsString class describes string values built by using the addition operator on strings" (rope representation, flattened on demand) — [V8 string.h](https://raw.githubusercontent.com/v8/v8/main/src/objects/string.h)

#### Startup and code caching
- Code caches are "associated with the URL of a script", only "functions that are compiled by the time the script finishes executing count towards the code cache", and parenthesized IIFEs are compiled eagerly by heuristic (the article calls abusing this a last resort) — [V8: code caching for JavaScript developers](https://v8.dev/blog/code-caching-for-devs)
- Chrome 136 ships explicit compile hints: `//# allFunctionsCalledOnLoad` at the top of a file compiles everything eagerly ("should be used sparingly"); in V8's experiment "17 out of 20 showed improvements, and the average foreground parse and compile times reduction was 630 ms" — [V8: explicit compile hints](https://v8.dev/blog/explicit-compile-hints)
- Node: `module.enableCompileCache()` (added v22.8.0, "no longer experimental" in v25.4.0) persists V8 code cache, which "can not be reused by a different version of Node.js"; `vm.Script` accepts `cachedData` — [Node: module](https://nodejs.org/api/module.html#moduleenablecompilecachecachedir), [Node: vm](https://nodejs.org/api/vm.html#scriptcreatecacheddata)
- Local: the 5.4 KB prelude compiles and runs in a median 0.269 ms, so caching it has little value — [hazards.cjs](optimization-evidence/scripts/hazards.cjs)

#### Advice that no longer applies (or is dated)
- "Avoid try/catch/finally in hot code": the V8 5.9 post (Ignition and TurboFan, Chrome 59) describes Crankshaft as able to "only optimize a subset of the JavaScript language" and "not designed to optimize JavaScript code using structured exception handling" — [V8: launching Ignition and TurboFan](https://v8.dev/blog/launching-ignition-and-turbofan)
- Matching call arity for speed: obsolete since the adaptor frame removal in v8.9 — [V8: faster JavaScript calls](https://v8.dev/blog/adaptor-frame)
- TurboFan Sea-of-Nodes graph knowledge: replaced by Turboshaft and Maglev (2023-2025) — [V8: leaving the Sea of Nodes](https://v8.dev/blog/leaving-the-sea-of-nodes), [V8: Maglev](https://v8.dev/blog/maglev)
- 2012 and 2015 engine-internals posts describe Crankshaft-era behavior; their principles hold but details are dated (the 4-map IC default still holds locally) — [2012 post](https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html), [2015 post](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html)
- Firefox's older type-inference-based optimizing frontend was replaced by Warp in Firefox 83 (2020) — [Mozilla Hacks: Warp](https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/)

### Inferences
- Code-generation guidelines derived from the findings: emit a leading `"use strict"` directive (or ESM) in generated files, so plain-`node` runs are strict like the playground and CLI `execute()` already are; initialize all fields in a fixed order and never emit `delete` (assign `undefined` or use `Map`); do not emit `arguments`, `with` or direct `eval` (use rest parameters); keep user call sites direct (native calls) so feedback stays per site; never mutate built-in prototypes after user code started; keep numeric variables numeric; leave `.length` reads in loops alone; emit `+` and template literals rather than array-plus-`join` (rope strings; no benchmark found either way).
- Compile hints and code caching are Chrome and Node specific and matter little at these sizes; they are optional polish after the structural fixes of sections 0 and 3.
- Emitting a leading `"use strict"` directive is a one-line change that removes the measured 7x sloppy-mode penalty for emitted files run by plain `node`, without touching the language; the CLI `execute()` and playground paths are already strict (section 0).
### Gaps
- The try/catch obsolescence is inferred from the article's description of Crankshaft's limits; the article text about TurboFan handling such code was not re-verified.
- Node 26's V8 version was not checked, and Turbolev's shipping status in Chrome or Node could not be established from primary sources (a web search returned only unrelated aerospace pages).
- No JavaScriptCore or SpiderMonkey measurements; the V8 blog fetched ends at 2025-08, so 2026 V8 developments are not covered by primary sources.
- Whether compile hints or code caching apply to `new Function` code (as used by the playground) was not established.
- The delete-last-property optimization's current status in V8 is unclear: the revert page is cited, later history appeared only in search-result summaries, and the local test shows no fast path.

## 5. Output formats and targets: ESM versus CommonJS, ECMAScript target, wrappers, top-level await and source maps

### Takeaway
Emit ESM as the primary format (strict by default, supports top-level await, tree-shakable) and keep a function-body path for the sandboxed playground; choose the target by Node's current support window (Node 20 is end-of-life as of this page, 22 and 24 are LTS) and remember that esbuild-style targets lower syntax only. Generate Source Map v3 now (ECMA-426, 1st edition December 2024) with an `ignoreList` for helper code, and track the stage-3 `scopes` and `range-mappings` proposals.

### Cited Findings

#### Modules, targets and wrappers
- `require(esm)` has been unflagged since v22.12.0 and v20.19.0 and "is no longer experimental" as of v25.4.0; ES modules containing top-level `await` cannot be `require()`d (`ERR_REQUIRE_ASYNC_MODULE`); an ES module can export the name `"module.exports"` to control what CommonJS consumers get — [Node: modules](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)
- Top-level await "only works at the top level of modules", with "no support for classic scripts or non-async functions"; a module using it "acts like a big async function" so importers wait — [V8: top-level await](https://v8.dev/features/top-level-await)
- Node releases as listed: v26 Current (first released May 05, 2026), v24 "Krypton" LTS, v22 "Jod" LTS, v20 EOL, v18 EOL; the page gives no EOL dates — [Node releases](https://nodejs.org/en/about/previous-releases)
- esbuild's `target` "is only concerned with syntax features, not APIs", so a runtime library must itself avoid APIs missing from the target — [esbuild API: target](https://esbuild.github.io/api/#target); Terser and SWC default `ecma` to 5 — [Terser options](https://terser.org/docs/options/), [SWC minification docs](https://swc.rs/docs/configuration/minification)
- The playground creates its worker with `{ type: 'module' }` but runs generated code inside `new Function(...)`, whose body cannot hold `import` or top-level `await` (per the module-only rule above) — [use-runner.ts:41-43](../../apps/playground/lib/use-runner.ts), [runner.worker.ts:74](../../apps/playground/workers/runner.worker.ts)

#### Source maps
- ECMA-426 is the "Source map format specification", 1st edition, December 2024 — [Ecma International: ECMA-426](https://ecma-international.org/publications-and-standards/standards/ecma-426/)
- The living draft (header "Draft ECMA-426 / September 11, 2026") says "The `version` field shall always be the number 3 as an integer", defines `sources`, `sourcesContent`, `names`, `mappings`, `ignoreList` and index maps (`sections`), and notes "The source map format does not have version numbers anymore" with further iteration expected from TC39-TG4 — [ECMA-426 draft](https://tc39.es/ecma426/)
- The proposals directory lists at least `debug-id`, `env`, `range-mappings`, `scopes` and `sources-hash`; both `scopes` and `range-mappings` state "Source maps proposal at stage 3 of the process"; `scopes` lets debuggers recover original names, removed scopes and inlined frames and cites terser and closure-compiler; `range-mappings` adds a `rangeMappings` field so unchanged code can be mapped without one mapping per character — [ECMA-426 proposals](https://github.com/tc39/ecma426/tree/main/proposals), [scopes](https://raw.githubusercontent.com/tc39/ecma426/main/proposals/scopes.md), [range-mappings](https://raw.githubusercontent.com/tc39/ecma426/main/proposals/range-mappings.md)
- Node's `--enable-source-maps` "makes a best effort to report stack traces relative to the original source file" and "can introduce latency to your application when `Error.stack` is accessed" — [Node CLI](https://nodejs.org/api/cli.html#--enable-source-maps)
- magic-string is "a small, fast utility for manipulating strings and generating sourcemaps": `generateMap` produces a v3 map, `hires: true` maps every character, edits include `overwrite`, `remove`, `prepend`, `append` and `move`; local size of `dist/index.mjs` 59,893 B (13,730 gzip; 11,829 brotli); `@jridgewell/gen-mapping` 0.3.13 unpacks to 93,797 B — [magic-string README](https://raw.githubusercontent.com/Rich-Harris/magic-string/master/README.md), [sizes.mjs](optimization-evidence/scripts/sizes.mjs)

### Inferences
- Default output: ESM text for the Node CLI and library use (strict, tree-shakable, `require(esm)` works on supported LTS lines as long as no top-level await is used), plus a function-body variant for the sandbox; programs with top-level `espera_um_cadim` need an `async` wrapper there, or module evaluation if the playground's CSP allows it.
- `es2022` is a conservative target for Node 22 and 24; I did not verify support tables for newer syntax.
- The prelude shifts user code to line 248, so even before a real source map exists, evaluating the runtime as a separate script (or pruning it) would align stack traces with the `.gs` file; a v3 map with `ignoreList` entries for helpers is the durable fix.
- For a text-substitution transpiler, magic-string-style edits give exact mappings cheaply, but an AST-based pipeline (section 1) is needed for correctness anyway, and its printer can emit mappings directly.
- Source maps do not exist today (section 0), so adding them also makes the `--source-map` CLI flag honest.

### Gaps
- Chrome, Firefox and Safari support for `scopes` and `range-mappings` was not checked, and ECMA-426 2nd-edition status or `debugId` adoption was not confirmed.
- Node 22/24 support tables for ES2023+ syntax were not fetched, so the target recommendation is conservative rather than verified.
- Whether the playground's CSP permits importing a generated module (Blob or data URL) was not checked.
- The source-map overhead (size, latency) was not measured.

## 6. Measuring and guarding optimizations: benchmarks, V8 tooling, size budgets and differential testing

### Takeaway
Use mitata (or tinybench) with `do_not_optimize` and `--expose-gc` in isolated processes and confirm with V8's own flags (`--trace-deopt`, `%HasFastProperties` under `--allow-natives-syntax`); treat differences below about 1.5x at tens of nanoseconds as noise (my own reruns swung 30-60%). Guard size with size-limit (brotli) and guard semantics with differential testing that runs original versus optimized output, in the style of UglifyJS's fuzzer and fast-check.

### Cited Findings

#### Benchmark tools and pitfalls
- mitata states "JIT can detect and eliminate code that has no observable effects" and "you must create observable side effects", offers `do_not_optimize`, computed parameters that are not counted, and "runs garbage collection once after each benchmark warmup" when run with `--expose-gc`; npm latest 1.0.34, last modified 2025-02-04 — [mitata README](https://raw.githubusercontent.com/evanwashere/mitata/master/readme.md), [npm registry](https://registry.npmjs.org/mitata)
- tinybench has "No dependencies", is "completely based on the Web APIs with proper timing using `process.hrtime` or `performance.now`", reports standard deviation, margin of error, variance and percentiles, warns that its timer-resolution estimate "is a sample-based heuristic, not a guaranteed bound", and lists benchmark.js and mitata under "Prior art"; npm 6.2.2 modified 2026-10-10 — [tinybench](https://raw.githubusercontent.com/tinylibs/tinybench/main/README.md), [npm registry](https://registry.npmjs.org/tinybench)
- benchmark.js's latest release is 2.1.4, published 2017-03-28 — [npm registry](https://registry.npmjs.org/benchmark)
- Microbenchmark pitfalls: use results "to prevent DCE from throwing them away"; avoid loop-invariant and constant expressions; engine specifics in that 2012 post are dated — [Vyacheslav Egorov](https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html)
- Local noise evidence: in three reruns the 8-element `arr.map` measured 58.3, 47.7 and 54.3 ns while the equivalent strict wrapper measured 46.4, 46.2 and 87.1 ns, and an imported helper that merely calls `map` measured faster than the native call — [sloppy-vs-strict-ab.cjs](optimization-evidence/scripts/sloppy-vs-strict-ab.cjs), [alias-bench.cjs](optimization-evidence/scripts/alias-bench.cjs)

#### V8 tooling (local, V8 13.6)
- `node --v8-options` lists `--trace-opt`, `--trace-deopt`, `--allow-natives-syntax`, `--print-opt-code`, `--log-ic`, `--log-maps`, `--log-function-events`, `--max-inlined-bytecode-size` and `--max-valid-polymorphic-map-count` (default 4); `%HasFastProperties(obj)` works under `--allow-natives-syntax`; `--trace-deopt` printed `marking dependent code ... reason: dependent prototype chain changed` for the late-patching script — [deopt-late.cjs](optimization-evidence/scripts/deopt-late.cjs), [hazards.cjs](optimization-evidence/scripts/hazards.cjs)
- The `%HasFastProperties` delete experiment used: `const a={x:1,y:2,z:3}; delete a.z; %HasFastProperties(a)` returned `false` on V8 13.6, versus `true` after `a.z = undefined` — [delete-fast-props.cjs](optimization-evidence/scripts/delete-fast-props.cjs), run with `node --allow-natives-syntax`.

#### Size budgets
- size-limit is "a performance budget tool for JavaScript" that "checks the size of files with Brotli (default), Gzip or without compression", can add a time limit, takes a `limit` per path in `package.json`, and has a GitHub Action that can reject oversized pull requests — [size-limit](https://raw.githubusercontent.com/ai/size-limit/main/README.md)
- Local baseline to budget against: sample output 5,884 B (gzip 1,699; brotli 1,498); the prelude alone 5,464 B (1,499; 1,313) — [baseline-sizes.cjs](optimization-evidence/scripts/baseline-sizes.cjs)

#### Differential and property-based testing
- UglifyJS's fuzzer generates random programs, restricts generation to features that parse on the running Node, runs the original, minifies with each configuration (`UglifyJS.minify(original_code, o)`), compares output with `sandbox.same_stdout`, excludes known-benign cases such as `unsafe_math`, reduces failing programs and flips options to name the suspect ("Suspicious") — [UglifyJS ufuzz](https://raw.githubusercontent.com/mishoo/UglifyJS/master/test/ufuzz/index.js)
- The minification benchmark verifies artifact integrity with a test before and after minification — [minification-benchmarks](https://github.com/privatenumber/minification-benchmarks)
- fast-check is "the property-based testing library for JavaScript and TypeScript" that generates inputs and "shrinks failures down to the smallest inputs that still reproduces them" — [fast-check](https://fast-check.dev/docs/introduction/)

### Inferences
- Proposed guard rails: (1) a differential harness that runs every `.gs` example plus generated programs through the unoptimized and optimized pipelines in `vm` contexts and compares console output and thrown errors, with fast-check generating expressions around NaN, negative zero, strings and getters; (2) a size-limit budget on the generated output and on the playground bundle; (3) a benchmark suite of 5-8 representative programs run in isolated child processes with `--expose-gc`; (4) a deopt-regression test that fails if `dependent prototype chain changed` appears after startup.
- Replace the unit tests that assert on prelude text with behavioral tests, otherwise any structural optimization will fail them.
- Never report a ratio below roughly 1.5x from a 40 ns microbenchmark; confirm with repeated fresh-process runs.

### Gaps
- No official statement of the stability of V8 flags was found (they appear in `node --v8-options`; Node's "Useful V8 options" section was not read in full), so flag-based tests may break across Node upgrades.
- mitata and tinybench accuracy was not compared head to head, and no browser benchmark harness was built.
- test262 conformance was not examined, and fast-check's Vitest/Jest integration is not documented on the introduction page that was fetched.
- The Terser fuzzer script returned a 404 and was not read; only the UglifyJS version was.
