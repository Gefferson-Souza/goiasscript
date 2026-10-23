# 🪄 Engoianador API

Cloudflare Worker que recebe texto e devolve em goianês raiz via LLM.

## Endpoints

```
GET  /            → status JSON
GET  /health      → { ok, model, bindings } (sem chamar provedor nem gastar cota)
POST /engoiana    → { "text": "olá" } → { "text": "ô sô, e aí" }
```

Erros voltam como `{ "error": "mensagem em goianês" }`, sempre em JSON e com os
cabeçalhos de CORS da origem permitida.

Regra do `/health`: `ok` só é `true` (HTTP 200) quando existem o Durable Object
da cota (`QUOTA_LEDGER`), o KV de cache (`ENGOIANADOR_CACHE`) e ao menos um
provedor (binding `AI` ou segredo `GROQ_API_KEY`). Faltando qualquer um, responde
503 com `ok: false`. Um deploy só com Workers AI conta como saudável; um deploy
sem nenhum provedor não. A resposta traz apenas presença, nunca valores. Os casos
estão em `test/health.test.ts`.

Validação de borda do `POST /engoiana`:

| Caso | Status |
|---|---|
| `Content-Type` diferente de `application/json` | 415 |
| `Content-Length` ausente | 411 |
| `Content-Length` inválido | 400 |
| `Content-Length` ou corpo acima de `MAX_BODY_BYTES` | 413 |
| JSON inválido, `null`, array, `text` que não é string, vazio ou só espaços, campo extra | 400 |
| `text` acima de `MAX_INPUT_CHARS` | 413 |

Limites: `MAX_INPUT_CHARS` caracteres por requisição e `RATE_LIMIT_PER_DAY` por rede.

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
  -d '{"text":"Olá, tudo bem com você?"}'
```

## Deploy (Cloudflare)

```bash
# 1. Login (uma vez)
npx wrangler login

# 2. Criar o KV namespace do cache (uma vez)
npx wrangler kv namespace create ENGOIANADOR_CACHE
# Cole o ID retornado em wrangler.toml na seção [[kv_namespaces]]
# (a cota mora no Durable Object QuotaLedgerObject: não precisa de KV)

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

- `src/index.ts` — lê a configuração (503 se inválida) e monta as portas.
- `src/handler.ts` — roteamento e pipeline: preflight, rota, kill switch, validação, cache, cota, provedores.
- `src/validation.ts` — validação de borda do corpo.
- `src/ports.types.ts` — contratos de cota, provedores, cache e saúde.
- `src/engoiana.ts` — chama Groq, fallback Workers AI.
- `src/prompt.ts` — system prompt + few-shot.
- `src/limiter.ts` — cota por rede e teto global, via Durable Object.
- `src/rate-limiter.do.ts` — `QuotaLedgerObject`, o ledger em SQLite (um objeto por rede e um global por dia).
- `src/quota/` — chave de rede (IPv4 inteiro, IPv6 pelo /64) e o ledger síncrono.
- `src/cors.ts` — allowlist por origem.
