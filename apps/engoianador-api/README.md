# 🪄 Engoianador API

Cloudflare Worker que recebe texto e devolve em goianês raiz via LLM.

## Endpoints

```
GET  /            → status JSON
POST /engoiana    → { "texto": "olá" } → { "engoianado": "ô sô, e aí" }
```

Limites: 2000 chars por requisição, 10 req/min por IP.

## Rodando local

```bash
# Da raiz do monorepo
pnpm install
cp apps/engoianador-api/.dev.vars.example apps/engoianador-api/.dev.vars
# Edite .dev.vars e coloque GROQ_API_KEY=gsk_...

pnpm engoianador:dev
# Worker sobe em http://127.0.0.1:8787
```

Teste:

```bash
curl -X POST http://127.0.0.1:8787/engoiana \
  -H "Content-Type: application/json" \
  -d '{"texto":"Olá, tudo bem com você?"}'
```

## Deploy (Cloudflare)

```bash
# 1. Login (uma vez)
npx wrangler login

# 2. Criar KV namespace pro rate limit (uma vez)
npx wrangler kv namespace create ENGOIANADOR_RL
# Cole o ID retornado em wrangler.toml na seção [[kv_namespaces]]

# 3. Setar a chave da Groq como secret
npx wrangler secret put GROQ_API_KEY

# 4. Deploy
pnpm engoianador:deploy
```

## Fallback

Se `GROQ_API_KEY` não estiver setada ou a Groq retornar 5xx, o worker
tenta usar Workers AI (`@cf/meta/llama-3.1-8b-instruct`). Pra ativar,
descomente a seção `[ai]` em `wrangler.toml`.

## Estrutura

- `src/index.ts` — fetch handler e roteamento.
- `src/engoiana.ts` — chama Groq, fallback Workers AI.
- `src/prompt.ts` — system prompt + few-shot.
- `src/rate-limit.ts` — KV-based, 10 req/min/IP.
- `src/cors.ts` — allowlist por origem.
