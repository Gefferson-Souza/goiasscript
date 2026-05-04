# 🇧🇷 GoiásScript v1.5 — Goianês na Web

> **Linguagem de programação goiana que transpila dialeto goianês para JavaScript**

GoiásScript é um experimento cultural e técnico: uma DSL brasileira que aceita
código escrito em goianês raiz (`uai`, `prosa`, `bota_pra_moer`) e produz JS
limpo. Esta é a versão **1.5 enxuta** — a v2.0 que ficou inflada na branch de
desenvolvimento foi arquivada em `archive/v2-experimental` e revisitada com
foco no que importa: zero install, identidade cultural forte, asset viral.

[![Versão](https://img.shields.io/badge/versão-1.5.0--rc.1-yellow.svg)](CHANGELOG.md)
[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8-orange.svg)](https://pnpm.io)

## 🚀 Instalação

```bash
# Via npm (a partir do release v1.5.0)
npm install -g goiasscript

# Para desenvolver no monorepo
git clone https://github.com/Gefferson-Souza/goiasscript.git
cd goiasscript
pnpm install
```

## 🎯 Início rápido

### 1. Armar o barraco (criar projeto)

```bash
goiasscript arma_o_barraco meu-projeto
cd meu-projeto
```

### 2. Escrever um arquivo `main.gs`

```goiasscript
uai nome é "Goiás"
uai numeros é [1, 2, 3, 4, 5]

prosa("Bem-vindo ao", nome)

uai dobrados é numeros.mapear(x => x vezes 2)
prosa("Dobrados:", dobrados)

faz_trem saudar(pessoa) {
  faz_favor "Eai " mais pessoa mais ", tudo beleza?"
}

prosa(saudar(nome))
```

### 3. Botar pra moer (executar)

```bash
goiasscript bota_pra_moer main.gs
```

## 🛠️ Ferramentas CLI

V1.5 entrega 2 binários enxutos (a v2 tinha 8 — os outros foram arquivados):

| Binário | Função |
|---|---|
| `goiasscript` | CLI principal (transpile, run, validate, scaffold) |
| `goias` | Roda de Prosa — REPL interativo goiano |

### Comandos de `goiasscript`

<!-- AUTO-GENERATED:cli-commands -->

| Comando | Alias | Descrição |
|---|---|---|
| `goiasscript traduz <arquivo.gs>` | `compile` | Transpila para JavaScript |
| `goiasscript bota_pra_moer <arquivo.gs>` | `run` | Transpila e executa |
| `goiasscript vê_se_tá_certo <arquivo.gs>` | `check-types` | Valida sintaxe e tipos |
| `goiasscript arma_o_barraco <nome>` | `new` | Cria estrutura de projeto novo |
| `goiasscript dedo_de_prosa` | `info` | Exibe banner com versão e info |
| `goiasscript --version` | — | Mostra versão (1.5.0-rc.1) |

<!-- /AUTO-GENERATED:cli-commands -->

### Comandos do REPL (`goias`)

| Comando | Descrição |
|---|---|
| `.desenrola` | Mostra ajuda |
| `.mostra_os_trem` | Lista variáveis em memória |
| `.zera_o_trem` | Limpa o estado do REPL |
| `.vaza` | Sai do REPL |

## 🗣️ Sintaxe goiana

### Declaração de variáveis

```goiasscript
uai nome é "João"          // const nome = "João"
trem contador é 0           // var contador = 0
```

### Operadores

| GoiásScript | JavaScript |
|---|---|
| `é` | `=` |
| `é_igualim` | `===` |
| `diferente` | `!==` |
| `mais` | `+` |
| `menos` | `-` |
| `vezes` | `*` |
| `dividido` | `/` |
| `e_mais` | `&&` |
| `ou_então` | `\|\|` |
| `num_é` | `!` |
| `maior_que` | `>` |
| `menor_que` | `<` |

### Controle de fluxo

```goiasscript
se_ocê_quiser (idade pelo_menos 18) {
  prosa("Maior de idade")
} se_num_for (idade pelo_menos 16) {
  prosa("Pode tirar título")
} se_não {
  prosa("Ainda criança")
}

vai_indo (uai i é 0; i menor_que 5; i mais 1) {
  prosa("Iteração", i)
}
```

### Funções

```goiasscript
faz_trem somar(a, b) {
  faz_favor a mais b
}

vai_na_frente faz_trem buscarDados() {
  uai resultado é espera_um_cadim fetch("/api/dados")
  faz_favor resultado.json()
}
```

### Valores especiais

| GoiásScript | JavaScript |
|---|---|
| `certeza` | `true` |
| `de_jeito_nenhum` | `false` |
| `nada` | `null` |
| `indefinido` | `undefined` |
| `ocê` | `this` |

## 🔧 Métodos goianos nativos

Veja [docs/METODOS_GOIANOS.md](docs/METODOS_GOIANOS.md) pra referência completa.
Resumo:

```goiasscript
// Texto
"Oi sô".pra_maiusculo()             // "OI SÔ"
"Oi sô".trocar("Oi", "Eai")         // "Eai sô"

// Lista
[1, 2, 3].mapear(x => x vezes 2)    // [2, 4, 6]
[1, 2, 3].filtrar(x => x maior_que 1) // [2, 3]

// Math
GoianoMath.sorteio()                // 0..1
GoianoMath.arredondar(3.7)          // 4
```

## 🏗️ Estrutura do monorepo

```
goiasscript/
├── packages/core/              # Pacote npm principal (goiasscript@1.5.0-rc.1)
├── apps/                       # W20+ — playground web e ENGOIANADOR API
├── docs/                       # Documentação + plano de relançamento
├── vscode-extension/           # Extensão VSCode (Marketplace)
└── KEEP-OR-ARCHIVE.md          # Triagem v1.5 (o que foi arquivado e por quê)
```

## 🧪 Testes

```bash
pnpm test                       # 85 tests passando
pnpm test:coverage              # Com relatório de cobertura
```

## 🎨 Extensão VSCode

```bash
cd vscode-extension
npm run package                 # Gera goiasscript-X.Y.Z.vsix
code --install-extension goiasscript-2.2.0.vsix
```

Recursos: syntax highlighting, ícones de arquivos `.gs`, snippets goianos.

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Resumo:

1. Fork + clone
2. `pnpm install && pnpm test`
3. Branch a partir de `main`
4. Conventional commits
5. PR com `pnpm test` + `pnpm lint` passando

## 🗄️ Sobre o slim down

A v2.0 inflou em 38k+ linhas com features over-engineered (JIT, LSP, debug
adapter, 4 templates pesados, 6 CLIs extras) que nunca tiveram audiência. A
v1.5 corta 70% mas preserva tudo em `archive/v2-experimental` (branch + tag
`v2.0-pre-archive`) — recuperável a qualquer momento. Detalhes em
[KEEP-OR-ARCHIVE.md](KEEP-OR-ARCHIVE.md).

## 📄 Licença

[MIT](LICENSE) — use, modifique, distribua.

## 👥 Autor

**Gefferson Souza** — [@Gefferson-Souza](https://github.com/Gefferson-Souza)

---

<div align="center">

**🇧🇷 Feito com carinho em Goiás**

*"Programar em goianês é prosa boa que vira código que roda."*

[![Estrelas](https://img.shields.io/github/stars/Gefferson-Souza/goiasscript?style=social)](https://github.com/Gefferson-Souza/goiasscript/stargazers)

</div>
