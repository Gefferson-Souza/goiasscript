# GoiásScript: recomendação final do arquiteto-chefe

Esta síntese cruza as 3 propostas, os 3 julgamentos e as auditorias A a E. Os arquivos citados ficam em `scratchpad/audit/` e em `research_notes/Arquitetura de compilador para GoiásScript/`. As decisões 1 a 6 do dono ficam como estão.

## 1. Veredito: MANTER o repositório e o nome, RECOMEÇAR o núcleo

| Item | Veredito |
|---|---|
| Repositório | **Manter** (mesmo remoto, histórico, CI, apps). Não criar repo novo. |
| Nome no npm | **Manter `goiasscript`.** Publicar `3.0.0` como `latest` e rodar `npm deprecate` na `2.0.0`. Só a 2.0.0 (monólito arquivado) existe no npm, e a 1.5.0 nunca saiu (KNOWN-FACTS). |
| Código do núcleo | **Recomeçar por inteiro** (`packages/core`, CLI, REPL, extensão). Preservar só os dados e a UX. |
| Histórico Rust (88% do peso, E F14) | Fica como tag `archive/rust-prototype`. Limpar com `filter-repo` é opcional e fica fora do caminho crítico. |

Evidências mais fortes:

1. **O núcleo é regex sobre texto e não tem conserto incremental.** 104 de 173 casos falham, ~26% do código é morto e `lexer.js` não é usado (A-nucleo F01–F05, F21). Cada correção de regex cria outra colisão (A F04–F06).
2. **O produto visível está quebrado por causa do núcleo.**
   - A CLI apaga o fonte com `filePath.replace('.gs', …)` (B F01, CRÍTICO).
   - O REPL não persiste variável (B F04).
   - 6 de 11 exemplos dão `SyntaxError` (B F07).
   - 9 de 15 `.gs` geram JS inválido com `success:true` (C QA-02).
3. **A troca é viável e barata.** A PoC por tokens com acorn corrige 89/100 casos (155/168 na bateria completa) em 97 linhas e processa 10k linhas em 54 ms, contra 384 ms hoje (A apêndice E).
4. **A casca vale ser mantida.** O playground (CI e 24 testes E2E verdes), o Worker (16/16 testes), a espinha pnpm/CI e as 53 keywords e 57 métodos aprovados estão bons (D resumo; C "manter a espinha"; A "Reaproveitar").
5. **Não há base de usuários a preservar, então a quebra é gratuita.** O runtime injetado são 5.464 B, 92,9% da saída do `ola-mundo`, e altera protótipos nativos (A F09/F24; optimization.md §0, §3). Nenhuma versão 1.5 chegou ao público, então `trem`→`let` e a remoção do prelúdio não custam migração.

## 2. As 3 abordagens

| | **Fichinha** (dialeto de acorn) | **Cerrado** (front-end à mão + printer) | **Cartilha-primeiro** (parser próprio + edições + CM6) |
|---|---|---|---|
| Esforço | ~62 dias (8 de folga) | ~80 dias (9,5 de reserva) | ~94 dias (marco web só no dia ~67–72) |
| Risco | **Baixo.** Portão go/no-go de 3 dias, plano B (PoC por tokens) e plano C (parser próprio, +10 dias). | **Alto.** Parser com recuperação, early errors e cover grammar em 10 dias, sem portão. | **Muito alto.** Ponto de decisão só no dia 30; o plano B perde os erros múltiplos que justificam o parser próprio. |
| Qualidade | Boa. Um erro por execução; emissão por edições (linhas e layout do aluno preservados); zero runtime. | Teto de diagnósticos mais alto (vários erros, rustc/Elm). Printer próprio perde o layout e as linhas do aluno. | Melhor desenho teórico e melhor lente pedagógica. Escopo extra sem pedido do dono (CodeMirror, export estático, escopo npm `@goiasscript`, `=` sempre erro, sem regex). |
| Aderência (educacional/viral, solo) | **Alta** | Média | Média-alta no conteúdo, baixa no prazo |

**Recomendada: Fichinha, com enxertos das outras duas.** Os motivos:

- O produto está quebrado e o vídeo já foi publicado. Chegar rápido pesa na lente viral, e esse plano é ~18 a 32 dias mais curto.
- Pela leitura da pesquisa (front_end.md §5, opção b2), delegar ao acorn só é sólido com o gancho dentro do laço tokenizer-parser, via `Parser.extend`. É exatamente o desenho adotado, e ele resolve por construção `{de:'SP'}` e `o.de` (A F04).
- Quem mantém o projeto sozinho herda menos código próprio. O prior_art.md §7–8 mostra que o padrão de falha das linguagens-piada é pico viral, um mantenedor e depois dormência.
- O erro único por execução é aceitável para iniciante (Python e Hedy fazem igual). Se a tradução de mensagens do acorn não ensinar bem, o plano C está desenhado e orçado.

## 3. Arquitetura recomendada (Fichinha + enxertos)

### 3.1 Pipeline do compilador (`packages/compiler`, isomórfico, sem `node:*`)

1. **normalize.** Remove o BOM e mantém CRLF. NFC vale só para a busca de keyword e para identificadores emitidos. Os offsets ficam no texto original (front_end.md §1, §6; corrige A F23).
2. **front-end = acorn com versão exata fixada** (8.16.0 ou a última verificada no dia 1) **+ `Parser.extend(goiasDialect)`.**
   - Sobrescreve `readWord`, `isContextual`, `isAsyncFunction` e a fila de tokens virtuais (`se_num_for` = `else`+`if`; `vai_na_frente_faz_trem` = `async`+`function`). A Fase 0 deve medir a superfície real de overrides, que provavelmente inclui `parseExprAtom` e o uso de `id.name === 'async'`. Não confie nos "~5 métodos".
   - **Correção de projeto (achada nos julgamentos).** Ao reaproveitar `tokTypes` existentes, o acorn usa `type.keyword` como nome do `Identifier` em posição de propriedade (`o.trem` vira `name:'let'`). Por isso: criar `TokenType` próprio com `keyword` igual à palavra goiana, e fazer a análise de escopo e o lowering lerem o **texto-fonte** pelo range, nunca `node.name`.
   - Palavras reservadas do inglês viram erro amigável ("isso é JS; em goianês é `uai`"). No spike, o acorn já rejeita `if (x) {}` sozinho (checkUnreserved). O "token de palavra inglesa" pode ser mais simples do que a proposta descreveu.
3. **subset gate.** Lista de **permissão** de tipos de nó ESTree, gerada como dado. Um nó novo de ES futuro cai fora por padrão. Fora da v1: generators, labels, `with`, import/export, getters/setters, campos privados, `delete`/`void`, `==` e `!=` (com dica).
4. **análise** (escopos próprios sobre acorn-walk, ~250 linhas). Entrega:
   - reatribuição de `uai`;
   - nome desconhecido com sugestão por distância de edição;
   - conflito de alias declarado pelo usuário;
   - detecção de `await` de topo.

   Enxertos pedagógicos vindos da Cartilha-primeiro:
   - `AssignmentExpression` em condição → "`é` virou atribuição, use `é_igualim`";
   - expressão sem efeito (o laço de README:131 é infinito por isso, A F12);
   - laço sem saída;
   - dica `console.log` → `prosa`.
5. **lowering → `Edit[]`.** Classes de regra: keyword, rename, property, static, global (resolvido por escopo), macro (`vixe`, `trocar` → `replaceAll`, corrige A F07). Alias com conflito usa um helper por alias, emitido só se usado, e **nunca** altera protótipo (optimization.md §3; corrige A F09).
6. **emit** com magic-string sobre o texto original. As linhas, os comentários e a indentação são os do aluno, e o source map sai por token. Com linhas idênticas, o erro de execução já aponta a linha certa do `.gs` via `vm.Script` (A apêndice D).
7. **Wrapper function-body** (enxerto da Cartilha-primeiro, que fecha a lacuna do Fichinha). Para `bota_pra_moer`, REPL e playground, abre `(async()=>{"use strict";` na **mesma linha 1**, com `columnOffset`. Assim `espera_um_cadim` de topo funciona sem deslocar linhas, e o exemplo async do vídeo continua valendo (KNOWN-FACTS).
8. **Invariantes.** Todo JS emitido passa em `acorn.parse` (oráculo grátis). O resultado de `compile()` é uma união discriminada, e erro de usuário nunca lança.

### 3.2 Modos de saída e otimização

- **Didático** (padrão): edições sobre o fonte, 0 B de runtime (hoje 5.464 B), estrito/ESM. Remove a penalidade ~7x do sloppy (optimization.md §3).
- **`--otimiza`**: o didático passado por **Terser** (compress, sem mangle), em chunk lazy no navegador. Mapas compostos com `@jridgewell/remapping`. Terser pesa 168 KB brotli e roda em 33 ms (optimization.md §2).
- **`--minifica`**: o mesmo com mangle.
- **Sem passes próprios na v1.** Vale a pena registrar uma coisa em linguagem simples: o ganho real de "otimizar" está em tirar o prelúdio e o modo sloppy, e isso o modo didático já entrega. Com programas de poucos KB, dobra de constantes e afins rendem sobretudo tamanho (optimization.md §1). Prometer "otimizado ao máximo" além disso seria exagero.
- **Metas de CI** (valores iniciais a travar no fim da Fase 1b, depois só podem melhorar):
  - bytes de runtime do `ola-mundo` = 0;
  - 10k linhas ≤150 ms (PoC: 54 ms);
  - 100k espaços em <100 ms (hoje 11,6 s, A F18);
  - 0 atribuições a `.prototype` nas saídas;
  - saída otimizada com o mesmo stdout da didática em todo o corpus (teste diferencial).

### 3.3 Runtime e métodos goianos

- Catálogo de 57 métodos em 10 tipos como **dados** (`{nome, receptor, classe, js}`), a partir de GoianoBuiltins.js e `docs/METODOS_GOIANOS.md`. Só entra alias 1:1 com semântica nativa; os que divergem saem ou usam a semântica nativa.
- Opcional, do Cerrado: passe **`guardaDeLaco`** (orçamento de iterações, erro goiano com a linha do `.gs`) só para os alvos playground e REPL. Resolve o loop infinito de iniciante sem depender só de matar o Worker.

### 3.4 Diagnósticos

- Catálogo `GSnnnn` com frases inteiras (front_end.md §4) e dois tons: `raiz` e `neutro`. O tom neutro mitiga a barreira de gíria regional (prior_art.md §5).
- Campo `lesson` ligando cada erro à lição da cartilha.
- Tabela de migração das palavras removidas (`presta_serviço`, `mexe_assim`, `se`, `senao`, `fazer`, `vixe_que`) com mensagem amigável em vez de `SyntaxError` (A F12).
- Comando `explica GSnnnn`.
- Três renderizações: ANSI, texto puro e JSON para o editor.
- Gate que extrai todos os `raise` do acorn instalado e exige código no catálogo. Assim nenhuma atualização vaza mensagem em inglês.
- Tradutor de erro de execução (V8) com catálogo próprio e a linha do `.gs`.
- Limite assumido: **um erro por execução**. Só o plano C muda isso.

### 3.5 Ferramentas sobre o núcleo

Todas consomem `compile()`; nenhuma reimplementa vocabulário.

- **CLI/REPL** (`goiasscript`, `goias`):
  - nomes e textos atuais preservados;
  - a saída só deriva de `.gs` exato, recusa saída igual à entrada e nunca apaga o fonte (B F01);
  - exit codes honestos (B F02);
  - `vê_se_tá_certo` é o compilador de verdade (B F03);
  - `--json`, stdin e aliases ASCII;
  - ajuda em goianês via `configureHelp`;
  - um template, executado no CI;
  - REPL com `vm.Context` persistente (B F04) e multilinha pelo "fim inesperado" do acorn.
- **Playground** (Next 15 + **Monaco mantido**):
  - Monarch gerada do vocabulário com `unicode:true`, uma linha que corrige o realce morto (D APP-05);
  - marcadores de erro ao vivo;
  - espera da saída assíncrona, com detector de ociosidade (~300 ms sem log, timeout duro de 5 s) e teto de log (D APP-04, APP-07);
  - CSP por recurso no worker de execução (o sombreamento de globais não é fronteira, D APP-01);
  - **spike de sandbox na Fase 0**, antes de qualquer UI;
  - toggle didático/otimizado.
- **Cartilha:** 10 a 12 lições em Markdown. Todo bloco ```gs é compilado e executado no CI.
- **Extensão VS Code:**
  - casca nova que embute o compilador;
  - gramática e snippets gerados;
  - comandos com `execFile` e argv em array (fecha a injeção de comando, E F01);
  - sem LSP e sem debugger;
  - um VSIX para Marketplace e Open VSX, publicado por OIDC antes de 2026-12-01 (quality_engineering.md).
- **Engoianador** (reescreve **prosa**, não código, `prompt.ts`; a validação via `analyze` proposta pelo Cerrado **não se aplica**):
  - modelo por variável de ambiente, com o ID verificado no dia (llama-3.1/3.3 foram desligados);
  - fallback Workers AI testado;
  - rate limit atômico por /64 com teto global;
  - testes de `index.ts` e `engoiana.ts` (0/8 mutantes mortos hoje, C QA-08).
  - Opcional: "engoianar código" determinístico via mapeador reverso, como plano B se a LLM cair e como gerador de corpus.

### 3.6 Qualidade e governança

Princípio: toda regra do dono vira mecanismo de máquina, e a prosa do CLAUDE.md só descreve.

- **Compilador e lint.**
  - TS 6 estrito (`erasableSyntaxOnly`, então `as const` em vez de `enum`).
  - ESLint 10 flat com `strictTypeChecked` e as regras `max-lines-per-function` 50, `max-lines` 400, `max-depth` 4, `no-console` (exceção única em `terminal.ts`), `no-explicit-any`, `no-param-reassign` e `functional/immutable-data`.
  - Identificadores em inglês: **regra ESLint com dicionário pt-BR menos en-US, mais o scanner R14 portado**. Uma regra só de "não ASCII" deixaria passar `const existente`, o incidente PR #1398 de 31/08.
  - dependency-cruiser (núcleo sem `node:*`) e knip (código morto).
- **Testes.** Vitest com 80% por pacote e catraca. Conformidade golden (`.gs`/`.js`/`.out`/`.diag.json`, `pnpm bless`), semeada pelos 173 casos, 25 blocos de doc e `run-repo-gs-files`. **Copiá-los do scratchpad para o repo no dia 1**, pois ele é temporário. Oráculos: `acorn.parse`, mapeador reverso, fast-check, diferencial O0×O1 e Stryker incremental.
- **Gate de promessas públicas.**
  - Instala o tarball em pasta limpa e roda `bota_pra_moer`.
  - Todo bloco ```gs compila.
  - Todo comando citado existe (teria pego o `gs-balaio`).
  - Varredura de todas as strings user-facing contra uma denylist de inglês, com snapshot do `--help`.
  - O manifest da extensão é consistente.
- **Processo.**
  - Proteção de `main`, husky 9 rastreado e commitlint.
  - ADRs em MADR com linha "Confirmação"; RFC só para mudança de linguagem, revisada pelo `plan-reviewer`.
  - CHANGELOG em português.
  - Changesets com publicação confiável e provenance, publicando o mesmo tarball testado.
  - `CLAUDE.md` com menos de 200 linhas, **versionado e fora do `.gitignore`**, com 11 de 16 afirmações falsas corrigidas (E F04).
- **Correções de promessa pública.**
  - A descrição do repo no GitHub diz "hand-written lexer and parser". Isso fica falso com acorn, então trocar por "transpilador sobre o acorn".
  - Incluir essa verificação no gate de promessas.
- **Commit sem ticket Jira.** Este repo pessoal não usa ID de ticket do trabalho. Seguir o escopo semântico do módulo (`feat(compiler): …`), registrado em ADR, e nunca inventar ID. A atribuição `Co-Authored-By` segue a política do dono; registrar no mesmo ADR.

### 3.7 Estrutura do repo

```
packages/language   vocabulário único + geradores (TextMate, Monarch, snippets, docs, ajuda)
packages/compiler   normalize, frontend, analysis, lowering, emit, diagnostics, runtime
packages/cli        goiasscript + goias
packages/vscode
apps/playground (+ cartilha)   apps/playground-e2e   apps/engoianador-api
docs/{spec,adr,rfc}   scripts/   tests/{conformance,corpus}
```

pnpm workspace, sem Turborepo. Removidos: `packages/core`, `vscode-extension/`, os `.vsix` commitados, `lsp-server/` e `KEEP-OR-ARCHIVE.md`. Tag `legacy/1.5` antes de apagar. O código antigo só sai quando o job de paridade passar de ≥95% da bateria de 173 casos.

## 4. Decisões que o dono precisa tomar

Congelar o vocabulário **até o dia 3**, porque mudar depois quebra programas e o vídeo.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | `trem` emite `var` ou `let`? | `var` (literal ao vídeo) / `let` | **`let`.** `var` ensina hoisting e fechamento de laço errados. Nada foi publicado. Conferir os quadros do vídeo (README:100 comenta `var`). |
| 2 | Palavras faltantes: `super`, `typeof`, `switch` | Criar / deixar fora | Aprovar nomes por RFC com o "teste da prosa" (a palavra existe no falar goiano?). Hoje os exemplos já usam `super(` quebrado. As propostas sugeriram `chama_o_pai` e `tipo_de`, que são a sugestão do arquiteto, não do dono. |
| 3 | Operadores | Só palavras / palavras + símbolos | **Aceitar os dois.** Só as palavras são reservadas. Oferecer flag `rígido` nas lições. Não tornar `=` sempre erro: acorn aceita de graça e o aluno cola JS de tutorial. |
| 4 | `==` e `!=` | Aceitar / recusar | **Recusar**, com dica para `é_igualim` e `diferente`. |
| 5 | Nomes de API em inglês (`console`, `Math`, `.map`) | Bloquear / aceitar | **Aceitar** como interoperabilidade. No modo cartilha, avisar "em goianês é `.mapear`". |
| 6 | Acentos | Só acentuado / grafia ASCII também | **Aceitar ASCII** (`oce`, `se_nao`) como entradas explícitas, com teste de colisão. Nada de dobra por NFD. |
| 7 | Módulos (`pega`/`troca_ideia`) | Implementar / adiar | **Fora da v1**, com mensagem amigável. O 1.5 já não cumpria. |
| 8 | Tom das mensagens | Só goianês raiz / camada separável | **Camada separável** (`--tom=neutro`), com explicação factual clara (prior_art.md §5). |
| 9 | Idioma dos comentários | Inglês (CLAUDE.md do projeto) / português (regra global) | **Português**, por precedência da regra global. Registrar em ADR (E F11). |
| 10 | Erro único por execução | Aceitar / parser próprio | **Aceitar na v1**, com plano C orçado (+10 dias) se o portão falhar. |
| 11 | Monaco ou CodeMirror | Manter / trocar | **Manter o Monaco.** A troca se apoia em hipótese não medida. |
| 12 | Itens externos ao código | Domínio, Pix/Sponsors, segredos do Worker, tokens npm/Marketplace | O domínio `goiasscript.com.br` não está registrado (KNOWN-FACTS). Decidir domínio ou usar o da Vercel, e substituir o Pix provisório (E F08). |

## 5. Sub-projetos na ordem de construção

Os números do Fichinha somam ~62 dias (inclui 8 de folga). Os enxertos acrescentam ~5 dias, uma estimativa minha (lessons e migração ~2, wrapper e ociosidade ~1, `guardaDeLaco` ~1, `explica` e dependency-cruiser ~1). O total esperado fica em **~67 dias** de um sênior solo.

| Ordem | Sub-projeto | Dias | Marco de saída |
|---|---|---|---|
| 0 | **Spike e portão.** Plugin de dialeto do acorn contra os 173 casos, spike de sandbox, RFC-0001 do vocabulário, ADR 0001–0003. | 3 | **≤5 falhas justificadas em 173.** Se falhar, aciona o plano B ou C. |
| 1a | Esqueleto de gates (tsconfig, ESLint, Vitest, husky, `ci.yml`, proteção de `main`, geração do vocabulário). | 2 | Código novo nasce sob os gates. |
| 1b | **Núcleo** (vocabulário, front-end, subconjunto, análise, lowering, emissão, diagnósticos, erro de execução, goldens, fast-check, orçamentos). | 17 | `compile()` estável. |
| 2 | **CLI e REPL.** Publicar `3.0.0-alpha` com dist-tag `next`. | 5 | Feedback real cedo. |
| 3 | Modos otimizado e minificado (Terser, mapas compostos, diferencial). | 3 | Metas de bytes e tempo no CI. |
| 4 | Playground. | 5 | E2E ampliado (fuga de sandbox, laço infinito, async). |
| 5 | Extensão VS Code. | 4 | VSIX único publicável. |
| 6 | Cartilha interativa. | 5 | Todas as soluções executam no CI. |
| 7 | Engoianador. | 3 | Smoke pós-deploy. |
| 8 | Docs, spec (EBNF com ids), limpeza, CLAUDE.md. | 3 | `check-docs` no CI. |
| 9 | Relançamento: `3.0.0` em `latest`, deprecate da 2.0.0, tag `v3.0.0`. | 2 | Depende das tarefas do dono (item 12). |
| — | Folga e endurecimento. | 8 | Revisão adversarial por fatia. |
| — | Enxertos pedagógicos (`lesson`, migração, `guardaDeLaco`, `explica`). | ~5 | Diluídos nas fases 1b, 4 e 6. |

**Caminho crítico:** Fase 0 → 1b → 2. O MVP (núcleo + CLI) é utilizável por volta do dia ~27.

## 6. Principais riscos e mitigação

| Risco | Mitigação |
|---|---|
| **Acoplamento às internas do acorn.** O README não garante a estabilidade de `readWord`, `isContextual`, `isAsyncFunction` nem da fila virtual (front_end.md, lacunas). A fila virtual é a parte mais frágil: no spike, `se_num_for` falhou sem ela. | Versão exata fixada, com teste que falha se a versão instalada diferir. Gate de mensagens do acorn. Conformidade. Portão de 3 dias com plano B (155/168) e plano C (+10 dias). |
| **Superfície de override subestimada** (`parseExprAtom`, `id.name==='async'`, lookahead por texto bruto). | A Fase 0 mede a superfície real. 5 dias para plugin e posições é otimista, então usar a folga. |
| **Escopo lê `node.name`** e enxerga `'let'` em `o.trem`. | Token próprio e leitura do texto-fonte pelo range. |
| **Um erro por execução.** O sublinhado do editor mostra um erro por vez. | Aceitável para iniciante. Registrar como limitação e manter o plano C documentado. |
| **Vocabulário não congelado** (`trem`→`let`, `super`, `typeof`, aliases duplicados). | RFC-0001 aprovada até o dia 3. Tabela de migração. Goldens regenerados. |
| **Barreira de gíria regional.** Não há evidência empírica sobre humor em erros (prior_art.md §5). | Tom separável e explicação factual. Testar com aprendizes de fora de Goiás antes do lançamento. |
| **Sandbox do playground.** O sombreamento de globais não é fronteira (D APP-01). | CSP por recurso e origem opaca, validadas por spike. O E2E ataca com `Function('return this')()`, `importScripts`, XHR e WebSocket. Sem carregar código por URL sem confirmação. |
| **Custo e abuso do Engoianador.** O limite é contornável (40 requisições passaram com limite 20, D APP-03) e o provedor já desligou 2 modelos. | Rate limit atômico, teto global, kill switch, modelo configurável, fallback e modo determinístico. |
| **Dependências externas ao código travam o relançamento:** domínio não registrado, Pix provisório, tokens npm/Marketplace (PATs encerram em 2026-12-01). | Listadas como tarefas do dono na Fase 9. Iniciar o método de publicação sem PAT já na Fase 0. |
| **Confusão com `goiasscript@2.0.0`.** | `npm deprecate` com mensagem apontando o recomeço. Página "o que mudou da 1.x/2.0 para a 3.0". |
| **Mantenedor único e dormência pós-viral** (prior_art.md §7–8). | Spec + conformance como contrato, superfície pequena, cartilha, automação de release e política de "não faz parte da v3" no README. |
| **Escopo rastejando de volta** (balaios, debugger, JIT, tipos). | Entram só por RFC. `gs-balaio` e `gs-fuçá` saem de README e CLAUDE.md. |
| **Regras do dono em tensão com a natureza de um compilador.** | Mutação permitida só local e não escapável (cursores e acumuladores), com regras ESLint que verificam isso. Pratt/tabelas só no plano C. |

**Dependências de decisão antes de começar:** itens 1 e 2 da seção 4 (vocabulário) e a escolha da versão exata do acorn no dia 1. A versão 8.16.0 está instalada no repo, mas a pesquisa mediu 8.19.0.