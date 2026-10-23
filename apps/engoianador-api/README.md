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

- `src/index.ts` — lê a configuração (503 se inválida) e monta as portas.
- `src/handler.ts` — roteamento e pipeline: preflight, rota, kill switch, validação, cache, cota, provedores.
- `src/validation.ts` — validação de borda do corpo.
- `src/ports.types.ts` — contratos de cota, provedores, cache e saúde.
- `src/engoiana.ts` — chama Groq, fallback Workers AI.
- `src/prompt.ts` — system prompt + few-shot.
- `src/rate-limit.ts` — KV-based, 10 req/min/IP.
- `src/cors.ts` — allowlist por origem.
