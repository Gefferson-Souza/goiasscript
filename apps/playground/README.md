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

O `vercel.json` só fixa framework, instalação (`corepack pnpm install --frozen-lockfile`),
build e saída padrão. Ele não traz cabeçalhos: a fonte única é o `next.config.ts`.
Nada é implantado por este repositório; o passo a passo abaixo é do dono do projeto.

1. Importa o repositório no Vercel e cria o projeto.
2. Root directory: `apps/playground`. Deixa o `vercel.json` valer (não sobrescreve os comandos).
3. Variáveis de ambiente de produção: as `NEXT_PUBLIC_*` do `.env.example`, com valores reais.
   Valor igual ao de exemplo derruba o build, de propósito.
4. Faz o deploy e anota o endereço `https://` que o Vercel devolveu.
5. No GitHub, abre a aba Actions, escolhe "Smoke do playground", clica em "Run workflow"
   e informa o endereço do passo 4 em `base_url`.
6. O smoke confere a home (CSP com `frame-ancestors 'none'`), o `/sandbox/runner.js`
   (JavaScript com a CSP isolada exata), o 404 em goianês e a página `/doacao`.
   Se algum item falhar, o job lista qual e o deploy não deve ser promovido.

Para rodar o smoke da sua máquina: `node scripts/run-smoke-playground.ts https://endereço`.

## Arquitetura

- `app/page.tsx` — playground principal (editor + saída).
- `app/engoianador/page.tsx` — UI do engoianador.
- `workers/runner.worker.ts` — Web Worker que transpila e executa.
- `lib/monaco-goias.ts` — registro da linguagem GoiásScript no Monaco.
- `scripts/copy-examples.mjs` — copia `.gs` de `packages/core/examples/basic/`
  para `public/examples/` em tempo de build.
