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

Pra apontar pra um Engoianador local:

```bash
cp apps/playground/.env.example apps/playground/.env.local
# Edita NEXT_PUBLIC_ENGOIANADOR_URL se necessário
```

## Build

```bash
pnpm playground:build
```

## Deploy (Vercel)

1. Importa o repositório no Vercel.
2. Root directory: `apps/playground`.
3. Variável de ambiente: `NEXT_PUBLIC_ENGOIANADOR_URL` (URL do worker em produção).
4. Build command e output ficam no padrão Next.

## Arquitetura

- `app/page.tsx` — playground principal (editor + saída).
- `app/engoianador/page.tsx` — UI do engoianador.
- `workers/runner.worker.ts` — Web Worker que transpila e executa.
- `lib/monaco-goias.ts` — registro da linguagem GoiásScript no Monaco.
- `scripts/copy-examples.mjs` — copia `.gs` de `packages/core/examples/basic/`
  para `public/examples/` em tempo de build.
