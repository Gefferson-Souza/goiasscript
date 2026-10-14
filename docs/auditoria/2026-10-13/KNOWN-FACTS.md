# Fatos já verificados em 2026-10-13 (não refaça; aprofunde ou contradiga com evidência)

Repo: <repo> (pnpm monorepo; deps já instaladas com
`corepack pnpm install --frozen-lockfile`; use `corepack pnpm ...` — `pnpm` não está no PATH).
Branch atual `feat/v1.5-launch-playground-engoianador` = conteúdo de `origin/main` (PR #6 mergeado).

## Core (`packages/core`, pacote npm `goiasscript`, versão 1.5.0)
- Transpilação = `src/compiler/simpleTranspiler.js`: substituição por REGEX ("substituições diretas"),
  com strings protegidas por placeholder; comentários NÃO são protegidos ("Clica em" vira "Clica in").
  Tabela com 55 entradas (2 duplicadas: `rejeita_isso`, `resolve_aí`) = 53 mapeamentos únicos.
- `src/compiler/lexer.js` (205 linhas) NÃO é usado por nenhum código de produção (só por
  `tests/unit/lexer.test.js`, 23 testes); tabela de keywords diverge (`presta_serviço`, `vazio`, `sei_lá`).
- Parser: não existe na 1.5. `src/parser/ASTParser.js` foi arquivado (branch `archive/v2-experimental`,
  tag `v2.0-pre-archive`); mesmo na v2 só era usado pelo JITCompiler, não pela tradução.
- `transpile()` prefixa um runtime de 246 linhas (`GoianoBuiltins.gerarImplementacaoGoiana()`) que estende
  protótipos nativos (ex. `Array.prototype.mapear`); o código do usuário começa na linha 247.
- `_convertJSMethodsToGoiano` reescreve métodos JS do código-fonte para nomes goianos (`.length` →
  `.tamanho()`, `console.log(` → `prosa(` ...) ANTES do mapeamento de keywords.
- `_checkForbiddenMethods` roda DEPOIS das substituições → todo programa que usa `prosa` recebe o aviso
  falso "O método console.log( não é goiano" (impresso no stderr pelo CLI).
- Testes: `corepack pnpm test` → 5 suítes, 85 passed / 85 total. Cobertura global ~63% statements;
  `src/cli/index.js` 0%; `browser.js` 0%; threshold configurado 50% (regra do dono: 80%).
- Saídas de ola-mundo, demo, pequi, lista-mapeamento e trechos classe/async/erro foram conferidas byte a
  byte contra o vídeo de lançamento (idênticas, descontado o runtime).

## CLI / REPL
- `bin/goiasscript.js` (654 linhas) e `src/cli/index.js` (357 linhas) coexistem.
- `arma_o_barraco` imprime caminho absoluto em "Local:".
- `--help` usa os textos padrão do commander em INGLÊS ("Usage", "Options", "display help for command").
- REPL `bin/goias.js` (424 linhas): cada linha roda em `eval("(function(){ ... })()")` → variáveis não
  persistem (`uai x é 5` e depois `prosa(x)` → "x is not defined").

## npm / publicação
- npm só tem `goiasscript@2.0.0` (2025-09-14), que é o monólito v2 arquivado (bins gspack, gsrepl,
  gs-fuça, gs-balaio, gsdebug...). A 1.5.0 nunca foi publicada; npm 11 recusa publicar 1.5.0 como `latest`
  sem `--tag`. O tarball da 1.5.0 sai SEM README/LICENSE (estão na raiz do monorepo).

## Apps
- Playground (`apps/playground`, Next.js 15 + Monaco, execução em Web Worker): CI (build + E2E Playwright)
  verde em 2026-06-01; NÃO há deploy (sem projeto na Vercel; `goiasscript.com.br` não registrado, mas está
  hardcoded em `app/layout.tsx`, `lib/share.ts` e `ALLOWED_ORIGINS` do Worker). Monaco só tem realce
  (Monarch), sem autocomplete.
- Engoianador (`apps/engoianador-api`, Cloudflare Worker): modelo Groq `llama-3.1-70b-versatile` foi
  DESLIGADO pela Groq em 2025-01-24 (o sucessor llama-3.3-70b-versatile em 2026-08-16); fallback Workers AI
  comentado; id do KV é placeholder; não deployado. README diz "10 req/min/IP", wrangler diz 20/dia.

## Extensão VS Code (`vscode-extension/`, v2.2.0)
- Não publicada (Marketplace e Open VSX sem resultado). `src/extension.js` sobe um LanguageClient em
  `../lsp-server/server.js` (arquivado; pasta vazia e fora do VSIX) → erro na ativação. Declara debugger
  (`./out/debug/goianoDebugAdapter.js` inexistente) e 8 comandos, só 2 registrados. Snippets incluem
  recursos arquivados (imports `pega`/`troca_ideia`, decorators `@Componente`...). README usa `presta_serviço`.

## Ambiente disponível
- Node 24 (fnm), npm 11.19, corepack pnpm 10.31, cargo/rustc instalados, browsers do Playwright em
  `<home>/.cache/ms-playwright` (chromium-1243).
- `.gitignore` ignora `CLAUDE.md`, `.claude/`, `lib/`, `out/`, `build/`, `dist/` e tem um padrão inválido `./docs`.
