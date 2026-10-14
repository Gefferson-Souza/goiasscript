# Crítica de completude: síntese GoiásScript (Fichinha + enxertos)

Fiz uma checagem independente de três pontos nas evidências. Em `node_modules/.pnpm/acorn@8.16.0` confirmei que `if` vira "Unexpected keyword" quando `readWord` não o tokeniza, que `tokTypes._let` não existe e que `o.uai` vira `name:"const"` ao reaproveitar `tt._const`. No `acorn.d.ts` conferi que `readWord`, `finishToken` e `isLet` não estão tipados. Não gravei nada.

## 1. Afirmações sem evidência ou contraditas

1. **"Playground com CI e 24 testes E2E verdes" (§1.4) está otimista.**
   - D resumo: o E2E passa 24/24 só com override do executável do Chromium. O `pnpm e2e` oficial falhou 24/24.
   - C QA-06: o CI não roda desde 2026-06-01 e há aviso de remoção do Node 20 em 2026-09-16, então pode estar quebrado.
   - D também dá veredito "refatorar" ao playground (runtime, worker e painel quase reescritos), não "manter".
   - Corrigir o texto da síntese e incluir "reativar o CI" (matriz 22/24, actions com node24, `workflow_dispatch` e `schedule`) como tarefa da Fase 1a.
2. **Contradição interna no REPL.**
   - O §3.1 item 7 manda usar o wrapper `(async()=>{...})` em `bota_pra_moer`, REPL e playground.
   - O §3.5 pede REPL com `vm.Context` persistente (B F04).
   - Dentro de uma função, `uai x é 5` não persiste para a linha seguinte. É o bug F04 de novo.
   - O REPL precisa de modo script (declarações de topo no contexto) e de outra solução para `await` de topo.
3. **"Gate ≤5 falhas em 173" e "paridade ≥95%" não fecham com as próprias decisões.**
   - A bateria codifica comportamento legado que a nova arquitetura remove de propósito (A apêndice B):
     - runtime e wrappers: 0/9 e 1/7;
     - avisos: 0/2;
     - `trem`→`let`;
     - `==` recusado;
     - módulos fora da v1;
     - palavras removidas.
   - Falta triar os 173 casos em "bug a corrigir" e "mudança esperada". Só depois o limite de falhas faz sentido.
4. **A evidência numérica (155/168, 54 ms) é da PoC por tokens, não do plano recomendado.**
   - Os 54 ms são só tokenização, sem parse nem análise nem magic-string.
   - O Fichinha (`Parser.extend`) não tem medição própria. As metas "≤150 ms" e "≤5 falhas" são palpite até o portão da Fase 0.
5. **Prazo do Marketplace contradiz o cronograma.**
   - O §3.5 diz "VSIX publicado por OIDC antes de 2026-12-01".
   - Pelo cronograma da própria síntese, a Fase 5 fecha no dia ~39 (de ~67). A partir de 2026-10-14 isso cai por volta de 7 de dezembro.
   - quality_engineering.md só diz que o caminho de publicação deve ser decidido agora, porque os PATs globais do Azure DevOps são aposentados em 2026-12-01. Não diz que a publicação precisa ocorrer antes.
   - A mesma pesquisa afirma que o Open VSX é só por token (lacuna na linha 316). "OIDC para Marketplace e Open VSX" está errado para o Open VSX. A síntese precisa de segredo com escopo restrito para ele.
6. **Aritmética do cronograma.** A tabela da §5 soma 60 dias (3+2+17+5+3+5+4+5+3+3+2+8), não 62. Somando os ~5 dos enxertos dá 65, não ~67. É pouco, mas o número aparece como esforço total.
7. **"Não há base de usuários" é premissa não medida.** O npm tem a 2.0.0 desde 2025-09-14 (KNOWN-FACTS). Ninguém mediu downloads, estrelas nem o alcance do vídeo. A síntese chama o vídeo de "já publicado" e diz que "nada chegou ao público" na mesma análise. O `npm deprecate` e a tabela de migração são suficientes, mas a premissa deve virar "baixo risco, não medido".
8. **"Terser: compress sem mangle" omite uma opção.** optimization.md §5 diz que Terser e SWC assumem `ecma: 5` por padrão. Fixar `ecma: 2022` no modo `--otimiza`, senão o resultado difere do didático em estilo e tamanho.
9. **A "correção de projeto" do `tokTypes` está certa, mas incompleta.** `trem`→`let` não pode ser `TokenType`, porque `let` é contextual no acorn (`tokTypes._let` não existe). Isso exige override de `isLet`, ou seja, mais superfície além dos "~5 métodos". Os tipos do acorn também não expõem nenhum dos métodos a sobrescrever. O plugin vai exigir `declare module` ou casts, em tensão com `strictTypeChecked` e "sem any". Registrar na Fase 0 como custo real.

## 2. Decisões de design da linguagem que ficaram de fora

- **Colisão de palavras reservadas com identificadores do aluno.**
  - Palavras como `mais`, `vezes`, `nada`, `diferente`, `dividido`, `de` e `em` são nomes naturais de variável em português.
  - front_end.md §1 alerta que o risco é muito maior que em JS. Recomenda reservar o mínimo e classificar cada palavra (reservada, contextual ou identificador).
  - A síntese só trata colisão de aliases ASCII. Falta a classificação palavra a palavra na RFC-0001.
- **Lista de permissão do subconjunto.** A síntese lista só as exclusões. Faltam decisões explícitas sobre:
  - arrow functions e `=>`;
  - destructuring e spread;
  - `?.` e `??`;
  - template literals;
  - regex;
  - `for…of` e `for…in` (as palavras `de` e `em` entram aqui);
  - `switch`.
- **Entrada do usuário.** Não há nome nem mecanismo para ler do teclado (CLI e playground) nem para timers. É essencial para uma linguagem de iniciantes.
- **Números.** Vírgula decimal (`1,5`) e milhar (`1.000,50`): front_end.md §4 sugere dica dedicada. A síntese não decide nem inclui no catálogo.
- **Sistema de tipos goiano** (`texto`, `numero`, `lista`, `coisa`, no CLAUDE.md do projeto): a PoC regride em V05 por isso. A síntese não diz se as anotações saem na v1.
- **Extensão de arquivo `.gs`.** Colide com Google Apps Script e Gosu no Linguist (E F30, hipótese). Falta decisão, `.gitattributes` e id da linguagem no VS Code.
- **Saída do `traduz`.** O modo didático é "estrito/ESM", mas um `.js` em CJS com `await` de topo quebra. É preciso definir extensão (`.mjs`?) ou usar o wrapper, e declarar o `engines` do pacote. A auditoria B F14 mostra `>=18`, enquanto o toolchain novo exige Node ≥22.12. Iniciantes brasileiros costumam ter Node velho ou Windows.
- **Receptor desconhecido nas rotas de alias.** A síntese resolve só "alias declarado pelo usuário" no mesmo arquivo. Ficam sem resposta:
  - `obj["mapear"]` dinâmico;
  - dados JSON com chave `tamanho`;
  - objetos de fora da unidade de compilação.
- A recomendação híbrida (a/b/c) de optimization.md §3 prevê o helper com despacho ao membro do usuário. A §3.3 da síntese mencionou "helper por alias", mas sem essa regra de despacho.
- **"Otimizado ao máximo" (decisão 4 do dono).** A síntese reduz o escopo a "remover prelúdio e sloppy + Terser". A justificativa é boa (optimization.md §0 e §1), mas deve virar a decisão #13 da §4, para o dono aprovar o rebaixamento de promessa.

## 3. Riscos não cobertos

- **Segurança e processo do repositório** (E F06 HIGH, C QA-12, QA-13):
  - SECURITY.md e CODE_OF_CONDUCT.md com e-mail `@example.com`;
  - Private Vulnerability Reporting desligado;
  - Dependabot e CodeQL ausentes;
  - workflows sem `permissions`, actions por tag e sem `concurrency`.
  - Nada disso aparece em §3.6, e o Worker agora guarda chave de LLM.
- **Privacidade** (D APP-24): o texto do usuário vai para a Groq sem aviso (LGPD, art. 9). Falta uma linha na UI e uma política curta.
- **Ativos virais** (D APP-14 e APP-15): a imagem OG renderiza o snippet quebrado, o título de `/doacao` está duplicado e faltam metadados sociais em `/engoianador`. Isso é o motor viral e a Fase 4 não o cita.
- **Erros do Next em inglês** (D APP-06): faltam `not-found.tsx`, `error.tsx` e `global-error.tsx` em goianês. A varredura "denylist de inglês" não pega páginas de framework.
- **Plugin de dialeto no TypeScript estrito**: ver item 9 da seção 1. Acorn não tipa as internas, o que força `any` ou declarações próprias.
- **Falta validação pedagógica**: a síntese cita "testar com aprendizes de fora de Goiás" como mitigação, mas nenhuma fase a inclui. A Cartilha cabe em 5 dias só como conteúdo, sem teste com aprendizes.
- **Windows e macOS**: nenhuma verificação no CI. NFD vem do macOS e os comandos acentuados no cmd.exe são um risco conhecido (B F18). Incluir Windows na matriz.
- **Instalação do pacote**: o tarball sai sem README e LICENSE (B F14). A síntese cobre isso só de forma implícita, no teste de instalar o tarball. Tornar explícito.
- **`guardaDeLaco`** insere contador no JS emitido. Isso entra em tensão com "0 B de runtime", "linhas idênticas" e o diferencial O0×O1. Restringir e testar só para playground e REPL.
- **TypeScript 7.0** saiu em 2026-07-08 sem API JS, e typescript-eslint exige TS <6.1 (quality_engineering.md). A escolha de TS 6 está certa, mas deve citar o alias `@typescript/typescript6` e a data de revisão. O pnpm 11 e o `eslint-plugin-functional` com ESLint 10 não foram verificados.
- **Regra ESLint "dicionário pt-BR menos en-US"** não tem medição de falso positivo. O scanner R14 tem (0/23). Manter o scanner como gate primário e a regra ESLint como complemento.
- **Divergência CLAUDE.md × regra global de commit.** A atribuição `Co-Authored-By` e o escopo semântico ficaram para um ADR. Está tratado como pendência, mas precisa ser fechado antes do primeiro commit do núcleo.

## 4. Achados CRITICAL e HIGH que a arquitetura não resolve (ou só resolve em parte)

| Achado | Situação |
|---|---|
| E F06 HIGH (SECURITY.md, canais, Dependabot) | **Não coberto.** |
| C QA-06 HIGH (CI parado, Node 20) | Só parcial. Falta o conserto concreto do workflow. |
| B F04 HIGH (REPL) | Coberto no texto, **contradito** pelo wrapper (seção 1, item 2). |
| D APP-06 HIGH (inglês no playground) | Parcial. Faltam as páginas de erro e 404 do Next. |
| B F05 e F14 (templates e README/LICENSE no tarball) | Cobertos só pelo gate de instalar o tarball. Tornar explícito. |
| D APP-04 HIGH (saída assíncrona) | Coberto pelo detector de ociosidade, mas a seção do wrapper precisa casar com ele. |
| E F01 CRITICAL, B F01 CRITICAL, D APP-01/02/03/05/07, C QA-01 a QA-08, A F01 a F12 | Resolvidos pela arquitetura. |

## 5. Premissas de ferramentas e versões a revisar (2026-10)

- Fixar o acorn: a pesquisa mediu 8.19.0 e o repo tem 8.14.0 e 8.16.0 no store. Escolher a versão no dia 1, como a síntese diz, e rodar a conformidade nela.
- Terser: definir `ecma` explicitamente (seção 1, item 8).
- Publicação no npm: publishers criados depois de 2026-09-03 são só "stage" por padrão e exigem aprovação com 2FA. O primeiro publish do trusted publisher precisa acontecer em até 2 dias após a configuração (quality_engineering.md, linhas 277-278). Incluir isso no plano da Fase 9.
- Vitest 5, commitlint e semantic-release exigem Node ≥22 (quality_engineering.md). Conciliar com o `engines` do CLI.
- Groq: os dois modelos já foram desligados (D APP-02). O ID do dia precisa de verificação com a API, não com memória.

## 6. O que está certo e não deve mudar

- Manter repo, nome e a infraestrutura pnpm/CI/Playwright. Recomeçar `packages/core` (A, B, C, D, E concordam). Tag de arquivo para o histórico Rust.
- Escolher a abordagem Fichinha com portão de 3 dias e planos B/C orçados. Medi que `Parser.extend` é viável e que `if` em inglês já é rejeitado pelo acorn. A pesquisa (front_end.md §5) aponta (b2) como a única delegação tecnicamente sólida.
- Ler o texto-fonte por range para o escopo, em vez de `node.name`. Confirmei que `o.uai` vira `"const"` ao reaproveitar `tt._const`.
- Emissão por edições com magic-string, linhas e layout do aluno preservados. Sem runtime e sem mexer em protótipos (optimization.md §3, F09, F24).
- Vocabulário como fonte única de dados, com geradores (TextMate, Monarch, snippets, docs, help). Resolve as nove listas divergentes (E F03).
- Catálogo `GSnnnn` com gate sobre as mensagens do acorn, tom separável e erro único por execução como limite assumido.
- Monarch com `unicode:true` (D APP-05), CSP por recurso do worker com spike antes da UI (D APP-01), contador atômico e teto global no Worker (D APP-03), `execFile` com argv em array na extensão (E F01).
- Gate de promessas públicas (instalar tarball, compilar todo bloco ```gs, comandos citados existem, denylist de inglês).
- Copiar a bateria de 173 casos, os 25 blocos de doc e `run-repo-gs-files` para o repo no dia 1, porque o scratchpad é temporário.
- Decisões 1 a 10 da §4, em especial `trem`→`let`, recusar `==`, módulos fora da v1, comentários em português e Monaco mantido. As ressalvas estão nas seções 1 e 2.
- Publicar `3.0.0` como `latest` com `npm deprecate` na 2.0.0, e a `3.0.0-alpha` em `next` para feedback cedo.

Arquivos citados:
- `<scratchpad>/audit/` (A a F, KNOWN-FACTS, RULES-DIGEST)
- `<repo>/research_notes/Arquitetura de compilador para GoiásScript/` (front_end.md, optimization.md, quality_engineering.md)
- `<repo>/node_modules/.pnpm/acorn@8.16.0/node_modules/acorn/dist/acorn.d.ts` (tipos do acorn)