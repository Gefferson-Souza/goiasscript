# GoiásScript — Plano de Relançamento v1.5 "Goianês na Web"

**Criado:** 2026-05-03 · **Owner:** Gefferson · **Status:** 📋 Planejado, aguardando W19 pra começar
**Princípio fundador:** *"Conteúdo é subproduto do código"* — todo asset viral nasce de um artefato técnico real.

---

## 🎯 Tese do relançamento

GoiásScript hoje é repo abandonado com 40⭐ e branch staging inflada (v2 nunca lançada, 38k+ linhas, 8 binários, JIT, LSP, debug adapter — over-engineering bonito mas inútil). **Relançar do jeito que está = pior que nunca lançar.**

**Pivot:** cortar 70% da staging, lançar **versão enxuta + 1 killer feature (ENGOIANADOR AI) + playground web zero-friction**. Posicionar como **vetor cultural/viral BR**, complemento do Tyrus (vetor financeiro/profissional internacional).

**Fórmula viral aplicada:** zero-friction + identidade cultural forte + asset compartilhável + voz autêntica (não wrapper genérico de IA).

---

## 📅 Cronograma macro (compatível com Tyrus W22 launch P0)

| Semana | Foco | Esforço | Compete c/ Tyrus? |
|---|---|---|---|
| **W19** (4-10/05) | Triagem staging (decisão keep/archive) | 3h | Não — sem código novo |
| **W20** (11-17/05) | Playground MVP local (Vite + transpiler embarcado) | 5h | Não — independente |
| **W21** (18-24/05) | **PAUSA GoiásScript** — foco 100% Tyrus pre-launch | 0h | Tyrus P0 |
| **W22** (25-31/05) | **TYRUS LAUNCH WEEK** — zero GoiásScript | 0h | Tyrus P0 |
| **W23** (1-7/06) | ENGOIANADOR backend (Worker + Groq) | 6h | Não — Tyrus já lançado |
| **W24** (8-14/06) | ENGOIANADOR frontend + asset viral pré-produzido | 6h | Não |
| **W25** (15-21/06) | **RELAUNCH GoiásScript v1.5** | 4h | Não |
| **W26-W29** | Triagem feedback + Hashnode deep dive + Fase 2 decisão | 1-2h/sem | Não |

**Total estimado: ~30h em 8 semanas** (média 4h/sem, dentro do cap TESE-RECONHECIMENTO de 5h/sem em criação).

---

## 🔪 Fase 0 — Triagem da staging (W19, 3h)

**Objetivo:** decidir o que vai pro v1.5 e o que arquiva. Zero código novo.

### Tarefas concretas

- [ ] **Sessão 1 (1h, segunda 04/05 noite):** Ler na ordem
  - `RELEASE_NOTES_v2.0.md` (já lido — refresh)
  - `ROADMAP.md`
  - `PROXIMOS_PASSOS.md`
  - `CHANGELOG.md`
  - **Output:** lista mental do que existe na staging

- [ ] **Sessão 2 (1h, terça 05/05 noite):** Audit do `src/`
  - `cd /home/gefferson-souza/Desktop/personal-projects/goiasscript && git checkout staging`
  - Inventariar: `ls src/` + `ls bin/` + `ls templates/` + `ls balaios/`
  - Para cada componente: classificar **KEEP / ARCHIVE / DELETE**
  - **Output:** arquivo `KEEP-OR-ARCHIVE.md` no repo

- [ ] **Sessão 3 (1h, quarta 06/05 noite):** Plano de execução
  - Criar branch `feat/v1.5-slim` a partir de `staging`
  - Listar arquivos pra remover/mover
  - **NÃO commitar ainda** (só plano)

### Decisão clara (pre-cooked, baseada no diagnóstico)

**KEEP no v1.5:**
- ✅ `src/compiler.js` + `src/compiler/*` (transpiler core)
- ✅ `src/goianoMethods/GoianoBuiltins.js` (runtime nativo)
- ✅ `src/errors/ErroGoiano.js` + `errorTranslator.js` (mensagens em goianês)
- ✅ `bin/goiasscript.js` (CLI principal)
- ✅ `bin/goias.js` (REPL)
- ✅ `vscode-extension/` (já funciona, não tocar)
- ✅ `examples/basic/` + `examples/classes/` (poucos exemplos enxutos)
- ✅ `tests/unit/compiler.test.js` + `lexer.test.js` + `errors.test.js` + `goianoBuiltins.test.js`

**ARCHIVE (mover pra branch `archive-v2-experimental`, não deletar):**
- 🗄️ `src/performance/JITCompiler.js` (legal mas inútil)
- 🗄️ `src/parser/ASTParser.js` (over-engineering)
- 🗄️ `src/types/TypeAnalyzer.js` (ninguém vai usar tipos em DSL hobbyista)
- 🗄️ `src/modules/ModuleResolver.js` (sem ecosystem real)
- 🗄️ `src/packages/PackageManager.js` (gs-balaio sem balaios)
- 🗄️ `src/debug/GoianoDebugger.js` + `GoianoDebugAdapter.js` (DAP elaborado, audiência zero)
- 🗄️ `lsp-server/` (LSP server completo)
- 🗄️ `bin/gs-balaio.js`, `gs-fuça.js`, `gspack.js`, `gsdebug.js`, `gs-debug-adapter.js` (CLIs extras)
- 🗄️ `templates/goias-web-framework/` (NestJS-like em goianês)
- 🗄️ `templates/roda-de-prosa/` (DDD-like em goianês)
- 🗄️ `balaios/goiano-http/` + `goiano-utils/`

**DELETE permanentemente:**
- 🗑️ Nada por enquanto. Tudo arquiva, decide depois se deleta.

### Critério de decisão

> *"Se em 2 anos eu olhar isso e tiver vergonha do over-engineering, mantenho. Se tiver vergonha do projeto inteiro, arquivo limpo."*

A staging tem orgulho técnico genuíno (JIT compiler em DSL é cool). Arquivar em branch ≠ desperdício — fica documentado, recuperável.

---

## 🎮 Fase 1 — Playground Web MVP (W20, 5h)

**Objetivo:** site web onde user escreve `.gs`, clica "Bota pra Moer", vê executar. Zero install.

### Stack (detalhes em [[STACK-ZERO-CUSTO]])

- **Frontend:** Next.js 15 (App Router) com Monaco Editor
- **Transpiler:** o `src/compiler.js` atual já roda em browser (é JS puro)
- **Execução:** `eval()` em iframe sandboxed (segurança)
- **Hosting:** Cloudflare Pages
- **Sem backend ainda nesta fase**

### Tarefas concretas

- [ ] **W20 segunda (1h):** Setup Next.js + Cloudflare Pages
  - `npx create-next-app@latest goiasscript-web --typescript --tailwind --app`
  - Conectar repo ao Cloudflare Pages (via dashboard)
  - Deploy hello-world em `goiasscript-web.pages.dev`

- [ ] **W20 terça (2h):** Editor + transpiler
  - `npm i @monaco-editor/react`
  - Configurar Monaco com syntax highlight básico de GoiásScript (reusar `tmLanguage.json` do vscode-extension)
  - Importar transpiler do repo principal: `npm link` ou copiar `compiler.js`
  - Botão **"Bota pra Moer 🐂"** roda transpile → JS → eval em iframe
  - Output em painel ao lado

- [ ] **W20 quarta (1h):** 3 exemplos pré-carregados
  - "Olá Mundo" (`fala "Eai sô!"`)
  - "Lista e mapeamento" (numeros.mapear...)
  - "Classe Pequi" (POO básica)
  - Botões "Carregar exemplo" no topo

- [ ] **W20 quinta (1h):** Polish + meta tags + Pix QR no rodapé
  - Open Graph image (gerar com Carbon screenshot)
  - Favicon goiano (emoji 🐂 ou ipê)
  - Footer: GitHub link + Pix QR + GitHub Sponsors badge
  - Deploy final em `goiasscript-web.pages.dev`

### Critério de aceite W20

- [ ] Site carrega < 2s no 3G (Cloudflare CDN garante)
- [ ] User cola código GoiásScript, clica botão, vê resultado em < 500ms
- [ ] Funciona em mobile (Monaco tem suporte responsivo OK)
- [ ] Open Graph válido (Twitter Card preview funciona)

---

## 🤖 Fase 2 — ENGOIANADOR Backend (W23, 6h)

**Objetivo:** API que recebe texto técnico, devolve explicação em goianês autêntico.

### Tarefas concretas

- [ ] **W23 segunda (1h):** Setup Cloudflare Worker
  - `npm create cloudflare@latest engoianador-api`
  - Configurar `wrangler.toml` com rotas
  - Deploy hello-world em `engoianador-api.<account>.workers.dev`

- [ ] **W23 terça (2h):** Cadastro Groq + integração
  - Criar conta em https://console.groq.com (Gmail, 30s)
  - Gerar API key, salvar como Worker Secret: `wrangler secret put GROQ_API_KEY`
  - Endpoint `POST /engoianar` recebe `{ text: string }` retorna `{ goianes: string }`
  - System prompt cuidadosamente curado (ver template abaixo)

- [ ] **W23 quarta (2h):** Rate limit + fallback
  - `wrangler kv:namespace create RATE_LIMIT`
  - Por IP: 20 req/dia free; 21+ → erro 429 com mensagem "ô sô, esgotei minha cota grátis hoje"
  - Fallback Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) quando Groq retornar erro
  - BYOK header opcional: `x-user-api-key` bypassa rate limit

- [ ] **W23 quinta (1h):** Testes + monitoramento
  - 5 inputs reais de teste (paper acadêmico, código TS, conceito CAP, etc.)
  - Validar saída autêntica (você é juiz, é nativo)
  - Plausible Analytics ou Cloudflare Analytics ativado

### System prompt (rascunho — refinar manualmente)

```
Você é um professor goiano legítimo, nascido em Goiânia, sotaque carregado mas nunca caricato.
Seu trabalho é traduzir conceitos técnicos complexos em explicações usando vocabulário goiano genuíno.

REGRAS:
1. Use goianismos REAIS (uai, ô sô, trem, mió, dimais da conta, vixe maria, arredar, fuçar)
2. NUNCA use estereótipos forçados ou ofensivos
3. Use analogias do dia-a-dia goiano: pequi, cerrado, pamonha, fazenda, mercado central, Caldas Novas
4. Mantenha a precisão técnica — explicação tem que ESTAR CERTA
5. Tom: amigo do bar te explicando, não professor formal
6. Tamanho: 3-6 parágrafos curtos, leitura em 30-60s
7. Termine sempre com 1 frase de bordão goiano relacionado

EXEMPLO bom:
Input: "explain consensus algorithms in distributed systems"
Output: "Ô sô, imagina que você tá no bar com 5 amigo decidindo qual cerveja vai pedir.
Cada um quer uma diferente. Pra ninguém sair brigado, vocês precisam concordar TODOS na mesma.
[...continua...]
Aí o garçom pega a Skol pra geral. Pronto, consenso! É mió o trem funcionar
do que ficar todo mundo tomando cerveja diferente. Tá ligado?"

NÃO faça:
- "Olá! Vou explicar..." (formal demais)
- "Bão demais!!!" (caricato)
- Inventar palavras que goiano não usa
```

### Critério de aceite W23

- [ ] `curl POST .../engoianar -d '{"text":"..."}'` retorna goianês autêntico em < 2s
- [ ] Rate limit funciona (testar 21 requests do mesmo IP)
- [ ] Fallback Groq → CF Workers AI testado (forçar erro 429 manual)
- [ ] BYOK header testado

---

## 🎨 Fase 3 — ENGOIANADOR Frontend + Asset Viral (W24, 6h)

**Objetivo:** UI clicável + 1 vídeo viral pré-produzido pronto pra W25 launch.

### Tarefas frontend (4h)

- [ ] **W24 segunda (1h):** Página `/engoianador` no mesmo Next.js
  - Textarea grande pro input (placeholder: "Cola aqui o trem complicado...")
  - Botão **"ENGOIANAR 🐂"** (estado loading com spinner)
  - Output em "balão de fala" estilo cartoon (visual goiano)

- [ ] **W24 terça (2h):** Função "Salvar como imagem"
  - `html2canvas` ou `react-to-image` pra gerar PNG do output
  - Botão "📸 Compartilhar" baixa PNG + abre Twitter/Reels intent
  - Imagem com branding GoiásScript (canto inferior: logo + URL)

- [ ] **W24 quarta (1h):** 5 exemplos pré-prontos no topo
  - "Algoritmo de consenso"
  - "Programação assíncrona"
  - "Por que Rust é melhor que C"
  - "O que é uma blockchain"
  - "Diferença entre TCP e UDP"
  - Click → preenche textarea + roda automaticamente (UX zero-friction)

### Tarefas asset viral (2h)

- [ ] **W24 quinta (2h):** Gravação 1 vídeo Reels/TikTok 30s
  - Roteiro: tela mostra textarea → cola "explain WebAssembly" → click → goianês aparece → screenshot vira sticker
  - Edição: CapCut (grátis), música trending BR
  - Legenda: "Inventei uma IA que explica programação em goianês 🤠 (link na bio)"
  - Salvar em rascunho, não publicar ainda (vai junto com launch W25)

### Critério de aceite W24

- [ ] Página `/engoianador` rodando localmente sem erros
- [ ] PNG gerado tem qualidade alta (mínimo 1200x630 pra Twitter Card)
- [ ] Vídeo de 30s gravado, editado, com legenda — pronto pra publicar

---

## 🚀 Fase 4 — RELAUNCH DAY (W25, 4h)

**Data alvo:** segunda-feira 15/06/2026 (W25), 9h BR / 8h ET (peak engagement BR + começo dia US)

### Tarefas pré-launch (sábado W24, 1h)

- [ ] Merge `feat/v1.5-slim` → `main` no repo principal
- [ ] Tag `v1.5.0` (`git tag -a v1.5.0 -m "Goianês na Web"`)
- [ ] Criar GitHub Release com release notes + screenshot do site + link
- [ ] Deploy final do `goiasscript-web` em Pages
- [ ] Testar tudo end-to-end (uma vez)

### Tarefas launch day (3h espalhadas)

- [ ] **9h BR — site no ar**
  - Verificar `goiasscript-web.pages.dev` carregando
  - Verificar ENGOIANADOR funcionando
  - Verificar Pix QR + GitHub Sponsors visíveis

- [ ] **9h30 BR — Hashnode deep dive EN publicado**
  - Título: *"How I added AI to my joke programming language — and why I cut 70% of its features first"*
  - 1.500-2.000 palavras
  - Conteúdo: postmortem da v2 inflada + arquitetura zero-cost + lessons learned
  - **Cross-post DEV.to imediatamente**
  - **Asset técnico genuíno → passa pergunta-teste TESE**

- [ ] **10h BR — Asset viral**
  - Publicar Reels Instagram + TikTok + YouTube Shorts (mesmo vídeo, 3 plataformas)
  - Legenda padrão BR: "Criei uma IA que explica programação em goianês 🤠 link na bio"

- [ ] **10h30 BR — X (EN técnico)**
  - Thread 6-8 tweets sobre o relaunch + arquitetura zero-cost
  - Carbon screenshot do código + screenshot ENGOIANADOR
  - Mention `@cloudflaredev` `@GroqInc` (orgs amam tag, podem amplificar)

- [ ] **11h BR — LinkedIn EN**
  - Post curto 800 chars sobre o caso técnico
  - Foco: "shipped a side project after 1 year — here's how I cut scope"
  - Termina com link

- [ ] **11h30 BR — Reddit (1 post seleto)**
  - r/brasildevs OU r/programming (NÃO ambos no mesmo dia)
  - Título: "I built a Brazilian-Portuguese DSL with an AI explainer (zero-cost stack, all free tiers)"

- [ ] **12h-22h BR — Triagem ativa**
  - Responder TODO comentário em todas as plataformas
  - Métrica de engajamento por hora
  - Screenshot dos primeiros 100⭐ se atingir

### Critério de aceite Launch Day

- [ ] Site no ar, ENGOIANADOR funcional
- [ ] 6 publicações feitas (Hashnode + DEV + Reels + TikTok + Shorts + X + LinkedIn + 1 Reddit)
- [ ] Resposta a todo comentário em < 2h durante o dia
- [ ] Capturar screenshots de tudo (vira asset pro post-mortem)

---

## 📊 Pós-launch (W26-W29, 1-2h/sem)

### Triagem semanal (sextas, 30min)

- [ ] Métricas: stars, visitantes, ENGOIANADOR calls, donations
- [ ] Issues novas: triar, taggar, responder rápido (mesmo "won't fix")
- [ ] PRs externos: review minimalista, merge se OK

### Conteúdo follow-up (W27 ou W28, 2h)

- [ ] 1 post Hashnode técnico segunda peça (pivot: deep dive em UMA das partes)
  - Opção A: "How I built a 100% client-side Monaco editor for a custom DSL"
  - Opção B: "Building a free LLM API proxy with Cloudflare Workers + Groq + KV rate limiting"
  - Opção C: "Designing AI prompts for cultural authenticity (lessons from a regional dialect bot)"

### Gate de decisão W29

**Métrica de validação:**
- Stars novas em 30 dias pós-launch
- Visitantes únicos mês 1
- ENGOIANADOR engagement (calls/dia médio)

**Se ≥ alvo (500⭐, 10k visitantes, 500 calls/dia):**
- ✅ Fase 5 (galeria pública) ativa em W30+
- Considera comprar `goiasscript.dev` (R$ 50/ano = afford)

**Se < alvo:**
- ✅ Mantém v1.5 vivo em low cadence
- README sinaliza "maintained at slow pace, contributions welcome"
- Foco volta 100% Tyrus + Hashnode authority building
- **Sem culpa.** Tentamos, não pegou. Aprendizado.

---

## 🌟 Fase 5 (CONDICIONAL — só se W29 gate passar) — Galeria Pública

**Objetivo:** transformar ENGOIANADOR em fonte contínua de UGC (user-generated content) viral.

### Stack adicional (ainda zero custo)

- Supabase free tier (Auth Google + Postgres 500MB)
- Tabela `engoianadas` com `(id, input, output, votes, created_by, created_at)`
- Página `/galeria` lista top 100, votação simples (anti-spam por IP)
- Botão "Aplaudir 👏" em vez de up/down (mais positivo)

### Estimativa: 8h em W30-W31

---

## 🎙️ Fase 6 (CONDICIONAL — só se receita ≥ R$ 100/mês) — TTS Sotaque Goiano

**Objetivo:** ENGOIANADOR fala. Vídeo TikTok automatizado.

- ElevenLabs Starter (US$5/mês) custeado por doações
- Vídeo gerado automaticamente: input → ENGOIANADOR → TTS → MP4 com legenda
- 1 vídeo/dia automático no TikTok

### Estimativa: 12h em W32+

---

## 🎁 Bonus: O que NÃO vai ser feito (e está ok)

Esses pontos foram considerados e **descartados conscientemente**:

- ❌ MCP server pra IDEs (audiência dev é menor que viral mainstream)
- ❌ Playground com colaboração em tempo real (over-engineering)
- ❌ Marketplace de balaios (sem ecosystem)
- ❌ Tema dark/light (mantém só dark, é nicho dev)
- ❌ i18n EN/ES do site (foco BR; ENGOIANADOR aceita input EN, mas UI é PT-BR)
- ❌ Conta paid Groq antes de receita (BYOK fallback resolve)
- ❌ Discord oficial (manutenção alta sem ROI claro pré-1k stars)

---

## 🏷️ Tags
#plan #goiasscript #relaunch #v1.5 #zero-cost #2026-q2
