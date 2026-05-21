# Contribuindo para o GoiásScript 🤠

Ô gente, que bão que ocê quer contribuir! Este guia explica como participar
do desenvolvimento do GoiásScript v1.5+.

## 🚀 Setup do ambiente

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | `>=18.0.0` |
| pnpm | `>=8.0.0` |

Se ainda não tem pnpm: `npm install -g pnpm` ou ver [pnpm.io/installation](https://pnpm.io/installation).

### Clonar e instalar

```bash
# 1. Faça fork pelo GitHub e clone seu fork
git clone https://github.com/SEU_USERNAME/goiasscript.git
cd goiasscript

# 2. Instalar dependências do monorepo
pnpm install

# 3. Confirmar que tudo funciona
pnpm test
```

### Estrutura do monorepo

```
goiasscript/
├── packages/
│   └── core/                       # Pacote npm "goiasscript"
│       ├── src/                    # Transpiler, lexer, runtime goiano
│       ├── bin/                    # CLIs: goiasscript, goias (REPL)
│       ├── tests/unit/             # Suites Jest
│       ├── examples/               # .gs de exemplo
│       └── templates/              # Templates de projeto
├── apps/                           # Playground (W20), ENGOIANADOR (W23)
├── docs/
│   ├── plano/                      # Plano de relançamento v1.5
│   └── METODOS_GOIANOS.md          # Referência de métodos goianos
├── vscode-extension/               # Extensão VSCode (independente)
├── KEEP-OR-ARCHIVE.md              # Triagem v1.5 (o que foi arquivado)
└── CHANGELOG.md
```

## 📜 Comandos disponíveis

<!-- AUTO-GENERATED:scripts -->

### Root (workspace)

| Comando | Descrição |
|---|---|
| `pnpm test` | Executa toda a suite de testes |
| `pnpm test:coverage` | Tests com relatório de cobertura |
| `pnpm lint` | ESLint em src/ e tests/ |
| `pnpm lint:fix` | ESLint com auto-fix |
| `pnpm format` | Prettier write em src/ e tests/ |
| `pnpm format:check` | Prettier check sem modificar |

### Dentro de `packages/core/`

| Comando | Descrição |
|---|---|
| `pnpm start` | Roda o exemplo básico via CLI |
| `pnpm dev` | Mesmo que start, mas com nodemon |
| `pnpm test:watch` | Tests em modo watch |
| `pnpm example:basic` | Roda `examples/basic/exemplo.gs` |
| `pnpm example:classes` | Roda `examples/classes/exemplo_classes.gs` |

<!-- /AUTO-GENERATED:scripts -->

## 🐛 Reportar bugs

Antes de abrir, busque issues similares. Se for novo:

1. Use o template de bug report
2. Inclua o `.gs` que reproduz o problema (mínimo possível)
3. Rode `node --version`, `pnpm --version` e cole no relatório
4. Anexe a saída de `pnpm test` se relevante

## 💡 Sugerir features

1. Abra issue com template de feature request
2. Explique a motivação (qual problema resolve?)
3. Considere alinhamento com o [PLANO-RELANCAMENTO](docs/plano/PLANO-RELANCAMENTO.md)
   — features fora do roadmap atual podem demorar mais

## 🔧 Fluxo de desenvolvimento

```bash
# 1. Branch a partir de main (ou feat/v1.5-slim enquanto não merge)
git checkout -b feat/sua-feature

# 2. Implemente + escreva testes (TDD preferido)
# 3. Rode os checks locais
pnpm test
pnpm lint
pnpm format:check

# 4. Commit seguindo conventional commits
git commit -m "feat: descrição clara da feature"

# 5. Push e abra PR
git push -u origin feat/sua-feature
```

### Convenção de commits

Padrão [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `refactor:` | Reorganização sem mudar comportamento |
| `docs:` | Mudanças só em documentação |
| `test:` | Adicionar/atualizar tests |
| `chore:` | Build, deps, configs |
| `perf:` | Melhoria de performance |
| `ci:` | Mudanças no GitHub Actions |

## 📐 Padrões de código

- **Estilo:** ESLint + Prettier (configurados na raiz)
- **Linha:** máx 100 caracteres
- **Strings:** aspas simples
- **Ponto e vírgula:** sim, sempre

## 🧪 Testes

- Coverage **mínimo configurado:** 50% (debt v1.5; volta pra 80% na Fase 1)
- Use `describe`/`it` com nomes descritivos
- Testes ficam em `packages/core/tests/unit/<modulo>.test.js`

```bash
# Suite completa
pnpm test

# Watch durante dev
cd packages/core && pnpm test:watch

# Cobertura
pnpm test:coverage
```

## 🌟 Áreas de contribuição priorizadas

Alinhadas com o [PLANO-RELANCAMENTO](docs/plano/PLANO-RELANCAMENTO.md):

### W20 — Playground Web ✅ (entregue na v1.5.0)

- [x] `apps/playground/` com Next.js 15 + Monaco Editor
- [x] Campo `exports` no `packages/core/package.json` com entry browser-safe
- [x] Sintaxe highlight do GoiásScript no Monaco (port do `vscode-extension/syntaxes/`)

### W23 — ENGOIANADOR API ✅ (entregue na v1.5.0)

- [x] `apps/engoianador-api/` com Cloudflare Worker + Groq integration
- [x] Rate limiting via Cloudflare KV
- [x] Fallback opcional para Cloudflare Workers AI

### Próximos alvos (pós v1.5.0)

- [ ] Persistência de snippets no playground (LocalStorage + share URL)
- [ ] Histórico de engoianações na UI
- [ ] LSP simples reaproveitando `vscode-extension/syntaxes/`

### Média prioridade

- [ ] Tests para `src/cli/index.js` (atualmente 0% cobertura)
- [ ] Corrigir lexer para `vai_na_frente presta_serviço` (com espaço)
- [ ] REPL com persistência de variáveis entre linhas
- [ ] Voltar coverage threshold pra 80%

## 🤝 Processo de review

1. Tests automatizados devem passar (CI/CD via GitHub Actions)
2. Sem regressão em coverage
3. Pelo menos um maintainer aprova
4. Squash & merge é o padrão

## 📚 Recursos

- [README](README.md) — overview do projeto
- [Plano de relançamento](docs/plano/PLANO-RELANCAMENTO.md) — roadmap detalhado
- [Métodos goianos](docs/METODOS_GOIANOS.md) — referência da runtime
- [KEEP-OR-ARCHIVE](KEEP-OR-ARCHIVE.md) — o que ficou e o que foi arquivado
- [Issues](https://github.com/Gefferson-Souza/goiasscript/issues)

## ❓ Dúvidas?

Abra uma issue com a label `question` ou inicie uma discussão em
[GitHub Discussions](https://github.com/Gefferson-Souza/goiasscript/discussions).

---

**Obrigado por contribuir com o GoiásScript! Bão demais ter ocê na turma! 🚀**
