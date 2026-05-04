# GoiásScript v1.5 — Stack Zero-Custo

**Criado:** 2026-05-03 · **Princípio:** R$ 0,00/mês recorrente até ~50k usuários ativos · **Pior caso escala:** US$ 30/mês quando doações já cobrem.

---

## 🏗️ Arquitetura geral

```
                              ┌─────────────────────────────┐
                              │  goiasscript-web.pages.dev  │
                              │  (Cloudflare Pages, free)   │
                              │  Next.js 15 SSG/SPA         │
                              └──────────┬──────────────────┘
                                         │
                       ┌─────────────────┼──────────────────┐
                       │                 │                  │
                  /playground       /engoianador        /sobre + /doacao
                  (client-side)     (chama API)         (estático)
                                         │
                                         │ POST /engoianar
                                         ▼
                              ┌─────────────────────────────┐
                              │  engoianador-api            │
                              │  .<account>.workers.dev     │
                              │  (Cloudflare Worker, free)  │
                              └──────────┬──────────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
            checa rate limit       chama LLM               loga analytics
            ┌───────────┐         ┌──────────┐           ┌──────────────┐
            │ CF KV     │         │ Groq API │           │ CF Web       │
            │ (free)    │         │ (free    │           │ Analytics    │
            │ 100k/dia  │         │  14.4k/d)│           │ (free, ilim.)│
            └───────────┘         └────┬─────┘           └──────────────┘
                                       │ se erro/limit
                                       ▼
                                  ┌──────────────┐
                                  │ CF Workers   │
                                  │ AI (free,    │
                                  │ 10k/dia)     │
                                  └──────────────┘
                                       │ se ambos limit
                                       ▼
                                  ┌──────────────────┐
                                  │ erro 429 → user  │
                                  │ usa BYOK         │
                                  │ (chave própria)  │
                                  └──────────────────┘
```

**Capacidade total free:** ~24.400 ENGOIANADOR calls/dia + bandwidth ilimitado + 100k API requests/dia.

---

## 📦 Cada camada em detalhe

### 1. Hospedagem do frontend — Cloudflare Pages

**O que é:** plataforma da Cloudflare pra sites estáticos e SSR.

**Por que ele e não Vercel/Netlify:**
- Bandwidth **ilimitado** (Vercel free é 100GB)
- Build minutes generosos (500/mês)
- CDN global automático (Cloudflare tem 300+ POPs vs Vercel ~30)
- Integração nativa com Workers (mesmo dashboard)
- Sem eject pra paid em escala absurda

**Setup:**
```bash
# 1. Criar repo no GitHub
gh repo create goiasscript-web --public

# 2. Conectar no dashboard Cloudflare:
#    Pages → Create → Connect to Git → escolhe repo
#    Build command: npm run build
#    Output dir: .next (Next.js) ou dist (Astro)
#    Auto-deploy on push

# 3. URL pronta: goiasscript-web.pages.dev
```

**Custos:** R$ 0 indefinidamente. Mesmo com 1M de visitantes/mês continua R$ 0.

---

### 2. Frontend framework — Next.js 15 vs Astro

**Recomendação: Next.js 15 (App Router)**

**Por quê:**
- Você já mexe com React/Next no Duofy → curva zero
- App Router com Server Components diminui JS shipped
- Suporte nativo a OG images dinâmicas (`next/og` gera Open Graph image por página)
- Middleware grátis no edge

**Quando seria Astro:** se quisesse 100% MPA estático sem React. Pra esse caso, Next.js encaixa melhor (Monaco Editor é React component, ENGOIANADOR é SPA-like).

**Setup:**
```bash
npx create-next-app@latest goiasscript-web \
  --typescript --tailwind --app --no-src-dir
cd goiasscript-web
npm i @monaco-editor/react react-syntax-highlighter html2canvas
```

---

### 3. Backend (proxy LLM) — Cloudflare Workers

**O que é:** edge functions serverless rodando em V8 isolates (mais rápido que Lambda cold start).

**Por que necessário:** **API key do Groq NÃO PODE vazar no client.** Precisa de proxy backend.

**Por que Workers e não Vercel Functions:**
- 100k req/dia free vs Vercel 100k/mês (3x mais generoso)
- Roda no edge (latência < 50ms global)
- Mesmo provider que Pages (single source of truth)
- KV/AI/D1 integrados sem latência cross-cloud

**Setup:**
```bash
npm create cloudflare@latest engoianador-api
cd engoianador-api
# Editar src/index.ts
npm run deploy
# URL: engoianador-api.<account>.workers.dev
```

**Estrutura mínima do Worker:**
```typescript
// src/index.ts (rascunho conceitual, refinar depois)
export default {
  async fetch(req, env) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    const byokKey = req.headers.get('x-user-api-key');

    // Rate limit (skip if BYOK)
    if (!byokKey) {
      const count = parseInt((await env.RATE_LIMIT.get(ip)) || '0');
      if (count >= 20) {
        return Response.json({
          error: 'rate_limit',
          message: 'Ô sô, esgotei minha cota grátis hoje. Volta amanhã ou cola sua chave Groq (link tutorial)'
        }, { status: 429 });
      }
      await env.RATE_LIMIT.put(ip, String(count + 1), { expirationTtl: 86400 });
    }

    const { text } = await req.json();
    const apiKey = byokKey || env.GROQ_API_KEY;

    // Tentativa Groq
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_GOIANES },
            { role: 'user', content: text }
          ],
          temperature: 0.85,
          max_tokens: 600
        })
      });
      if (groqRes.ok) {
        const data = await groqRes.json();
        return Response.json({ goianes: data.choices[0].message.content, source: 'groq' });
      }
    } catch (e) {
      // fallthrough pro fallback
    }

    // Fallback: Cloudflare Workers AI
    const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_GOIANES },
        { role: 'user', content: text }
      ]
    });
    return Response.json({ goianes: aiRes.response, source: 'cf-ai' });
  }
}
```

**`wrangler.toml`:**
```toml
name = "engoianador-api"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "<gerado por wrangler kv:namespace create>"

[ai]
binding = "AI"
```

**Secret:**
```bash
wrangler secret put GROQ_API_KEY
# cola a chave gerada em console.groq.com
```

---

### 4. LLM primário — Groq API

**O que é:** API LLM hosting Llama 3.1 70B com inferência ultra-rápida (< 500ms).

**Por que Groq:**
- **Free tier mais generoso de 2026:** 14.400 req/dia
- Modelo Llama 3.1 70B (qualidade ~ GPT-4o-mini)
- Velocidade: 250-500 tok/s (vs ~50 tok/s OpenAI)
- Cadastro grátis com Gmail, sem cartão de crédito

**Limites free tier (verificar em https://console.groq.com/settings/limits):**
- 14.400 requests/dia
- 1M tokens/dia
- 30 requests/min (rate limit por janela)

**Pra ENGOIANADOR com média 200 tokens output:**
- 14.400 × 200 = 2.88M tokens/dia teórico → bate em 1M antes
- Realisticamente: ~5.000 calls/dia confortáveis

**Cadastro:**
1. https://console.groq.com → "Sign in with Google"
2. API Keys → Create API Key
3. Copiar (só mostra 1 vez), salvar como Worker Secret

---

### 5. LLM fallback — Cloudflare Workers AI

**O que é:** modelos LLM hosted no edge da Cloudflare, integrados com Workers.

**Por que como fallback:**
- Already same provider (zero auth/CORS pain)
- Free tier: 10.000 neurons/dia (~10k Llama 3.1 8B inferences)
- Integração: `env.AI.run(...)` direto no Worker
- Llama 3.1 8B = qualidade menor mas aceitável pra fallback

**Trade-off:** qualidade do output cai vs Groq 70B. Aceitável porque é só pra dia que Groq estourou.

---

### 6. Rate limiting — Cloudflare KV

**O que é:** key-value store distribuído globalmente, eventually consistent.

**Por que pra rate limit:**
- 100k reads/dia + 1k writes/dia free
- TTL nativo (`expirationTtl: 86400` = expira em 24h)
- Latência < 10ms no edge

**Estratégia:**
- Key: IP do user (`cf-connecting-ip` header)
- Value: contador de requests no dia
- TTL: 24h (reseta naturalmente)
- Limite: 20 req/dia/IP grátis (suficiente pra UX casual)

**Quando bater limite:** retorna 429 com mensagem em goianês + link tutorial Groq BYOK.

---

### 7. Database (Fase 2 só) — Supabase

**Não é necessário pro v1.5 launch.** Só ativa se Fase 2 (galeria pública) for liberada após gate W29.

**Free tier:**
- Postgres 500MB
- 50.000 MAU (Monthly Active Users)
- 5GB bandwidth
- Auth Google OAuth incluído
- Storage 1GB

**Setup quando ativar:**
```bash
# 1. https://supabase.com → New project
# 2. Copy URL + anon key
# 3. npm i @supabase/supabase-js
# 4. Tabela `engoianadas` via SQL editor
```

---

### 8. Auth Google (Fase 2 só) — Supabase Auth

Vem grátis no mesmo Supabase tier. Configurar:
- Dashboard → Auth → Providers → Google → enable
- OAuth credentials no Google Cloud Console (grátis)
- Redirect URI: `https://goiasscript-web.pages.dev/auth/callback`

---

### 9. Analytics — Cloudflare Web Analytics

**O que é:** alternativa privacy-friendly ao Google Analytics, sem cookies.

**Por que:**
- Free, ilimitado, sem cap
- Sem necessidade de banner LGPD/GDPR (não trackeia individualmente)
- 1 snippet de JS pequeno (~5kb)

**Setup:**
1. Dashboard Cloudflare → Web Analytics → Add a site
2. Cola URL `goiasscript-web.pages.dev`
3. Pega snippet, cola no `_app.tsx` ou `layout.tsx`

**Bonus:** se quiser real-time + conversions, adiciona **Plausible self-hosted** depois (Oracle Free Tier).

---

### 10. Doações — multi-canal

**Setup pré-launch:**

**a) GitHub Sponsors (devs internacionais)**
- https://github.com/sponsors → Get started → Setup pessoa física BR
- Stripe taxa ~3% + IOF
- Tier sugeridos: $5, $20, $100/mês
- Adicionar `FUNDING.yml` no repo:
  ```yaml
  github: [Gefferson-Souza]
  custom: ['https://goiasscript-web.pages.dev/doacao']
  ```

**b) Pix QR (BR direto)**
- Gerar QR code em qualquer app de banco (Itaú, Nubank, Inter)
- Salvar PNG do QR + chave (CPF/email)
- Página `/doacao` mostra QR + chave copy/paste
- Footer do site: link discreto

**c) Ko-fi (alternativa internacional simples)**
- ko-fi.com/Gefferson-Souza → cadastro grátis
- Botão "Buy me a coffee" no footer
- Taxa Stripe ~3%

**Mensagem (footer + página doação):**
> *"GoiásScript é grátis pra sempre. Se te ajudou ou divertiu, paga um pequi pro Gefferson 🐂"*

**NÃO FAZER:** popup, paywall, premium tier, locked features. Mata viralidade.

---

## 💰 Quando começa a custar (gatilhos honestos)

| Gatilho | O que acontece | Custo extra | Como pagar |
|---|---|---|---|
| > 24k ENGOIANADOR calls/dia | BYOK pop-up ativa pros 5% mais ativos | R$ 0 | Não precisa pagar |
| > 100k req/dia Workers | Vai pra paid plan | US$ 5/mês (5M req) | Doações cobrem trivialmente |
| > 50k MAU Supabase | Pro plan obrigatório | US$ 25/mês | Só ativa se Fase 2 + tração real |
| Comprar `.com` | Após viralizar uma vez | US$ 10/ano = R$ 4/mês | Bonus, não obrigatório |
| ElevenLabs TTS Starter | Fase 6 opcional | US$ 5/mês | Condicional a receita >R$ 100/mês |

**Pior caso realista:** US$ 35/mês quando o projeto tem 100k+ usuários e R$ 500+/mês em doações.
**Melhor caso (típico):** R$ 0/mês permanentemente até > 50k usuários.

---

## 🔐 Segurança e secrets

**Nunca commitar:**
- ✋ `GROQ_API_KEY` (sempre via Worker Secret)
- ✋ `SUPABASE_SERVICE_ROLE_KEY` (se ativar Fase 2)
- ✋ `.env.local` no Next.js (gitignore garantido)

**OK commitar (são públicas):**
- ✅ Supabase URL + anon key (RLS protege)
- ✅ Cloudflare Account ID
- ✅ Pix QR PNG + chave (são pra receber dinheiro)

**Rate limit é DEFENSIVO:**
- Não confiar em IP único pra anti-abuse total
- Adicionar `Cloudflare Turnstile` (CAPTCHA invisível, free) se houver abuso real
- Logs centralizados em Workers logs (free tier 1M logs/dia)

---

## 🧪 Testes mínimos antes de launch

### Smoke tests automatizados

```bash
# Build local funciona
cd goiasscript-web && npm run build

# Worker local funciona
cd engoianador-api && wrangler dev

# E2E manual: 
# 1. site carrega < 2s
# 2. playground roda exemplo "Olá Mundo"
# 3. ENGOIANADOR retorna texto em < 3s
# 4. rate limit bate em 21 requests
# 5. BYOK bypass funciona com chave Groq válida
# 6. share-as-image gera PNG válido
# 7. Pix QR scaneia (testar com seu próprio celular)
```

### Carga (opcional, só se viralizar parecer iminente)

```bash
# Apache Bench: 1000 req em paralelo
ab -n 1000 -c 50 https://engoianador-api.workers.dev/engoianar
# Esperado: 0 erros 5xx, média < 1s
```

---

## 📚 Documentação que vai virar conteúdo

Cada decisão técnica acima vira **1 parágrafo de Hashnode deep dive**. Estimativa de fonte:

- "Why I chose Cloudflare over Vercel for a viral side project" → 1 post
- "Building a free LLM API proxy with Workers + Groq + KV rate limiting" → 1 post (esse é o W27 followup)
- "Designing AI prompts for cultural authenticity" → 1 post
- "How to ship a side project with $0 infrastructure" → 1 post

**4 posts já mapeados** = autoridade técnica acumulada via execução real (passa pergunta-teste TESE).

---

## 🏷️ Tags
#stack #goiasscript #zero-cost #cloudflare #groq #2026
