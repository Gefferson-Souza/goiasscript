# GoiásScript

**Criado:** 2025 · **Status:** 🟡 Repo público mas adormecido (~40⭐, staging com v2 inflada nunca lançada) · **Relançamento alvo:** ~2026-06-08 (W25, segunda-feira)

**Repo:** https://github.com/Gefferson-Souza/goiasscript
**Site (futuro):** `goiasscript.pages.dev` (Cloudflare Pages, grátis) → `goiasscript.dev` quando viralizar
**Branch atual:** `staging` (15 commits à frente de main, v2.0 nunca taggeada)

**Reposicionamento estratégico:** ver [[PLANO-RELANCAMENTO]] — **slim down + playground web + ENGOIANADOR (AI feature)**. Cortar 70% das features da staging que ninguém vai usar. Foco em viralidade cultural BR + zero-friction adoption.

---

## 🎯 Objetivo (relançamento)

Transformar GoiásScript de "DSL ambiciosa abandonada" em **produto viral cultural BR + showcase técnico do Gefferson**. Não compete com Tyrus — vetor diferente (cultural/distribuição vs financeiro/profissional).

**Métrica norte:** **500⭐ no GitHub + 1 vídeo TikTok 50k+ views** até W30 (jul/2026).

## 🧭 Por Que Faz Sentido (link com TESE-RECONHECIMENTO)

- **Passa pergunta-teste:** depende de ARTEFATO técnico (DSL real, código real, runtime real) — não de persona/carisma → ✅ pode promover agressivamente
- **Vetor de distribuição BR:** audiência nacional warm-up pra Tyrus depois (fluxo: viraliza por humor → gente vê outros projetos → contrata)
- **Brand "Gefferson o cara que fez X"** — diferencial vs N outros backend engineers BR
- **Custo zero** (stack 100% free tier) — não compromete cashflow
- **Risco baixo:** se não pegar, custo-tempo limitado a ~30h totais espalhadas em 8 semanas

## 📦 Escopo

### Inclui (v1.5 launch — "Goianês na Web")
- **Slim down:** mata 70% da staging (JIT, LSP, debug adapter, web framework, balaios)
- **Playground web:** escreve `.gs`, executa no browser via JS transpiler (zero install)
- **ENGOIANADOR:** AI tool que explica conceitos técnicos em goianês autêntico (Groq API, free tier)
- **VSCode extension:** mantém atual (já funciona)
- **Asset viral:** 1 vídeo Reels/TikTok 30s + 1 Hashnode deep dive técnico EN
- **Doações desde dia 1:** GitHub Sponsors + Pix QR (sem fricção, sem popup)

### NÃO Inclui (escopo negado v1.5)
- ❌ Galeria pública / leaderboard (Fase 2, só se v1.5 pegar)
- ❌ TTS sotaque goiano (Fase 4 opcional, só se receita)
- ❌ Login Google obrigatório (BYOK invisível só quando rate limit estoura)
- ❌ Domínio `.com` próprio (subdomínio Pages até primeira viralização)
- ❌ MCP server (Fase 3 opcional, audiência dev é nicho menor)
- ❌ Database / persistência além de cache (mantém stateless)
- ❌ Re-arquitetura do core (mantém transpiler atual, só limpa)

---

## 📚 Documentos deste projeto

- [[PLANO-RELANCAMENTO]] — fases, semanas, tarefas concretas, gates de decisão
- [[STACK-ZERO-CUSTO]] — arquitetura técnica completa (R$ 0,00/mês)
- [[DESIGN-BRIEF]] — brief pro Google Stitch (paleta, tom, telas, prompts prontos)

---

## 🛠️ Stack final (zero custo)

| Camada | Tecnologia | Custo |
|---|---|---|
| Frontend | Next.js 15 (App Router) ou Astro | R$ 0 |
| Hospedagem | Cloudflare Pages | R$ 0 |
| Backend (proxy LLM) | Cloudflare Workers | R$ 0 (100k req/dia) |
| LLM primário | Groq API (Llama 3.1 70B) | R$ 0 (14.4k req/dia) |
| LLM fallback | Cloudflare Workers AI (Llama 3.1 8B) | R$ 0 (10k req/dia) |
| Rate limit | Cloudflare KV | R$ 0 |
| Analytics | Cloudflare Web Analytics | R$ 0 |
| Doações | GitHub Sponsors + Pix QR + Ko-fi | R$ 0 setup |
| Domínio | `.pages.dev` subdomain | R$ 0 |

**Total mensal recorrente: R$ 0,00.** Detalhes em [[STACK-ZERO-CUSTO]].

## 📅 Marcos macro (compatível com Tyrus W22 launch P0)

- [ ] **M1 (W19, 4-10/05):** Triagem da staging — decidir keep/archive (sem código novo)
- [ ] **M2 (W20, 11-17/05):** Playground MVP local (transpiler já existe, só embarcar)
- [ ] **PAUSA W21-W22 (Tyrus launch — zero GoiásScript)**
- [ ] **M3 (W23, 25-31/05):** ENGOIANADOR backend (Worker + Groq)
- [ ] **M4 (W24, 1-7/06):** ENGOIANADOR frontend + integração + asset viral pré-produzido
- [ ] **M5 (W25, 8-14/06):** **RELAUNCH DAY** — v1.5.0 tag + Cloudflare Pages live + Hashnode deep dive + Reels/TikTok + Pix QR
- [ ] **M6 (W26-W29):** Triagem de feedback, primeiras issues, decisão sobre Fase 2 (galeria)

## 📈 Tração / Métricas

| Métrica | Atual (W18, 03/05/2026) | Meta launch (W25) | Meta T2 (W30) | Stretch (W52) |
|---|---|---|---|---|
| GitHub stars | ~40 | 80+ | **500+** | 2.000+ |
| Visitantes únicos site/mês | 0 | 1.000+ | 10.000+ | 100.000+ |
| ENGOIANADOR calls/dia | 0 | 50+ | 500+ | <14k (cap free tier) |
| Vídeos TikTok/Reels publicados | 0 | 1 | 4+ | 20+ |
| Views vídeo top | 0 | 5k | **50k+** | 500k+ |
| Hashnode posts publicados sobre | 0 | 1 (technical deep dive EN) | 2 | 4 |
| GitHub Sponsors / mês | R$ 0 | R$ 50+ | R$ 200+ | R$ 1.000+ |
| Issues abertas externos | 0 | 5+ | 20+ | 100+ |
| PRs externos | 0 | 1 | 5+ | 30+ |

## 🚦 Gate de decisão (W26 — pós relaunch)

**Se M5 (W25) NÃO atingir mínimo:**
- < 80 stars novas em 7 dias OU < 1.000 visitantes site
- → **Pivot pra "showcase morto digno":** README "Maintained at low cadence", documenta caso, foco volta 100% pra Tyrus
- Sem culpa: GoiásScript continua de pé, sem expectativa pública de releases

**Se M5 atingir alvo:**
- → Fase 2 ativa (galeria pública + Supabase Auth + login Google)
- Cap esforço: máximo 4h/sem em GoiásScript pós-launch (TESE-RECONHECIMENTO)

---

## ⚠️ Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Distrair foco do Tyrus W22 | Média | Cronograma pausa GoiásScript W21-W22 inteiras |
| Viralizar e estourar free tier Groq | Baixa | BYOK invisível ativa em rate limit; cap CF Workers AI fallback |
| Issues vão acumular sem resposta | Média | Issue templates + bot stale-issues; cap 1h/sem em manutenção |
| Voz goiana parece artificial / ofensiva | Média | Curadoria manual de prompts; goianismos validados (você é nativo) |
| Reposicionamento confunde brand "Senior NestJS+Rust" | Baixa | GoiásScript fica em vertical separada; LinkedIn EN não promove diretamente |

---

## 🔗 Recursos

- Repo: https://github.com/Gefferson-Souza/goiasscript
- Pasta local: `/home/gefferson-souza/Desktop/personal-projects/goiasscript`
- Branch staging: `git log staging --oneline -15` (15 commits, v2 inflada)
- Groq API console: https://console.groq.com (cadastro grátis)
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/
- Stitch (design): https://stitch.withgoogle.com (MCP integrado)

## 🏷️ Tags
#project #goiasscript #relaunch-2026-06-08 #vetor-cultural #zero-cost
