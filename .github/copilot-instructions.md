# Copilot Instructions: GoiásScript Codebase

Purpose: Enable AI coding agents to quickly contribute to GoiásScript (a dialect-to-JS transpiler + VSCode extension) without breaking language semantics or dev workflows.

## 1. Big Picture

- Single-file transpiler: `goiasscript.js` reads a `.gs` file, performs keyword/pattern substitution, then executes resulting JS in a sandbox (Node `vm.runInNewContext`).
- Language spec lives mainly in `README.md` (canonical keyword mapping) + runtime mappings inside `GoiasScriptCompiler.keywords` and `patterns` arrays.
- Error UX: Custom `ErroGoiano` class translates native JS errors into culturally styled messages (see top of `goiasscript.js`). Never remove this pathway; extend by adding new type codes in constructor translation map + detection logic in `traduzirErroJS`.
- VS Code extension (`goiasscript-language/goiasscript/`) supplies syntax highlighting (TextMate grammar + language configuration) and packaged `.vsix` versions (0.1.0, 0.2.0).

## 2. Core Workflows

Run file: `node goiasscript.js <arquivo.gs>` or after global install just: `goiasscript <arquivo.gs>`.
Show compiled JS for debugging: `goiasscript --compiled exemplo.gs` (prints transformed code + preserves stack when error occurs).
Dev convenience: `npm start` runs `exemplo.gs`; `npm run build` emits transpiled JS to `exemplo.js` via stdout redirection inside script.
Install extension locally: `cd goiasscript-language/goiasscript && code --install-extension goiasscript-0.2.0.vsix`.
Add new keyword: update `this.keywords` (exact token → JS snippet), maybe add a regex entry in `this.patterns` if structural (e.g. class/inheritance, composed async function forms). Then mirror docs in `README.md` and optionally grammar in `syntaxes/goiasscript.tmLanguage.json`.

## 3. Compilation Pipeline (Hot Spots)

1. Pre-pass regex replacements (`this.patterns`): structural transforms (classes, access modifiers, `aprepara_trem` → `constructor`, async forms, `ocê` → `this`). Order matters—keep broader class patterns before generic token splitting.
2. Additional manual replacements (Promise helpers, method normalization, property assignment normalization with `é`).
3. Token split on whitespace + punctuation → per-token keyword substitution excluding string literals/comments/numerics.
4. Post-fix adjustments for function/method declarations (`presta_serviço <name>(` simplification).
   Edge cases: Avoid altering content inside quotes; current logic skips tokens starting with `'` or `"`. When adding features, ensure new regexes do not greedily match across string literals.

## 4. Error Handling Pattern

- Use `vixe` for generic `throw new Error` mapping; `vixe_que` maps to helper `vixeGoiano()` which throws an `ErroGoiano` directly.
- To introduce a new friendly error classification: add key in translation table in `ErroGoiano` constructor + detection branch in `traduzirErroJS`.
- Maintain user experience: All thrown errors in execution path should route through `traduzirErroJS` in `execute()` catch block.

## 5. Conventions & Style

- Codebase intentionally lightweight; avoid introducing build steps or external parser libs unless absolutely necessary.
- Keep new keywords culturally coherent (Portuguese/Goiano, snake_case) and symmetric with existing ones.
- Preserve backward compatibility—do not rename existing tokens; instead add aliases if needed.
- Update docs (README keyword tables) atomically with any compiler mapping change.
- Keep modifications inside `GoiasScriptCompiler` deterministic; no stateful global side effects.

## 6. VSCode Extension Notes

- Grammar file: `syntaxes/goiasscript.tmLanguage.json` must be kept in sync with new keywords (add to appropriate regex groups).
- Bump extension `package.json` version when shipping syntax changes; produce a new `.vsix` (not automated here).

## 7. Safe Change Checklist (Before PR / Commit by Agent)

- Added keyword? Updated: compiler keywords + README table + grammar.
- Structural transform? Added/ordered regex in `patterns` before tokenization.
- New error type? Updated: translation map + detection branch + (optional) docs snippet.
- Tested: Run a representative `.gs` sample with and without `--compiled` to validate output and error translation.

## 8. Examples (Minimal)

Input: `uai x é 2 mais 3; prosa(x);`
Output JS: `const x = 2 + 3; console.log(x);`
Class snippet: `arruma_trem Bixo { aprepara_trem() { prosa("Oi"); } }` → `class Bixo { constructor() { console.log("Oi"); } }`

## 9. What NOT To Do

- Do NOT replace the tokenization with a full parser unless explicitly requested.
- Do NOT emit TypeScript types; target plain JS.
- Do NOT alter CLI flags (`--compiled`, `--help`, `--version`).

## 10. Quick Reference (Key Files)

- Compiler & runtime: `goiasscript.js`
- Language spec & user docs: `README.md`
- Examples/tests: `*.gs` at repo root
- VS Code language support: `goiasscript-language/goiasscript/`

Feedback welcome: Clarify sections if expansion needed (e.g., extending async patterns or adding data structure sugar).
