# 🎮 Playground — GoiásScript

Editor web do GoiásScript em Next.js 15 + Monaco. Transpila e roda no navegador
via Web Worker isolado.

## Rodando local

```bash
# Da raiz do monorepo
pnpm install
pnpm playground:dev
# Abre http://localhost:3000
```

## Configuração pública

Tudo que o navegador vê vem de variáveis `NEXT_PUBLIC_*`, validadas em `config/site-config.ts`
(só `https:` em produção, sem usuário e senha na URL). Variável ausente desliga o recurso;
valor igual ao do `.env.example` derruba o build de produção. Nunca ponha segredo aqui.

```bash
cp apps/playground/.env.example apps/playground/.env.local
# Troca os placeholders pelos valores reais
```

Variáveis: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENGOIANADOR_URL`, `NEXT_PUBLIC_DONATION_PIX_KEY`,
`NEXT_PUBLIC_DONATION_SPONSORS_URL`, `NEXT_PUBLIC_DONATION_KOFI_URL`, `NEXT_PUBLIC_CONTACT_URL`.

## Cabeçalhos de segurança

`config/security-headers.ts` monta a CSP da página e a do runner (`/sandbox/*`), e o
`next.config.ts` aplica as duas. O compilador novo entra pelos pacotes `@goiasscript/*` do workspace.

## Build

```bash
pnpm playground:build
```

## Deploy (Vercel)

1. Importa o repositório no Vercel.
2. Root directory: `apps/playground`.
3. Variáveis de ambiente: as `NEXT_PUBLIC_*` do `.env.example`, com valores reais.
4. Build command e output ficam no padrão Next.

## Arquitetura

- `app/page.tsx` — playground principal (editor + saída).
- `app/engoianador/page.tsx` — UI do engoianador.
- `workers/runner.worker.ts` — Web Worker que transpila e executa.
- `lib/monaco-goias.ts` — registro da linguagem GoiásScript no Monaco.
- `scripts/copy-examples.mjs` — copia `.gs` de `packages/core/examples/basic/`
  para `public/examples/` em tempo de build.
