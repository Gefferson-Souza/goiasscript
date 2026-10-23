# GoiásScript: programar em goianês

> Linguagem de programação em goianês que vira JavaScript, uai!

GoiásScript é uma linguagem educacional: você escreve com palavras do falar goiano (`uai`, `prosa`, `faz_trem`) e o
compilador entrega JavaScript limpo, com as linhas do seu `.gs` preservadas. Ela não é JavaScript, e o compilador
avisa em goianês quando ocê escorrega.

[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)

## Instalar

Precisa do Node 22.12 ou mais novo. O pacote npm entra no ar na primeira publicação da v3.

```bash
npm install --global goiasscript
```

## Início rápido

Crie um projeto, entre nele e bote o programa pra moer:

```bash
goiasscript arma_o_barraco meu-projeto
cd meu-projeto
goiasscript bota_pra_moer main.gs
```

Um programa de exemplo:

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

## Comandos

| Comando | O que faz |
| --- | --- |
| `goiasscript traduz arquivo.gs` | vira o `.gs` em JavaScript (`.mjs`) |
| `goiasscript bota_pra_moer arquivo.gs` | traduz e já executa o programa |
| `goiasscript vê_se_tá_certo arquivo.gs` | só confere o programa e mostra todos os problemas |
| `goiasscript arma_o_barraco nome` | cria um projeto novo a partir do modelo |
| `goiasscript explica GS0301` | explica um erro com exemplo e lição |
| `goiasscript dedo_de_prosa` | mostra a versão e umas informações |
| `goias` | abre a roda de prosa (REPL) |

Todos aceitam a escrita sem acento (`ve_se_ta_certo`). O README do pacote
[`goiasscript`](packages/cli/README.md) detalha as opções.

## A linguagem em poucas linhas

```goiasscript
uai idade é 20

se_ocê_quiser (idade pelo_menos 18) {
  prosa("Maior de idade")
} se_não {
  prosa("Ainda criança")
}

vai_indo (trem i é 0; i menor_que 3; i é i mais 1) {
  prosa("Volta", i)
}
```

A especificação, o vocabulário e a gramática ficam em [docs/spec](docs/spec). As decisões de arquitetura estão em
[docs/adr](docs/adr).

## Playground e Engoianador

- **Playground:** editor no navegador que compila e executa goianês sem ir a servidor nenhum. Localmente:
  `corepack pnpm playground:dev`.
- **Engoianador:** API que recebe um texto e devolve em goianês usando um modelo de linguagem. Ela só responde depois
  de implantada pelo dono do projeto; localmente: `corepack pnpm engoianador:dev`.

## Extensão do VS Code

Realce de sintaxe, trechos prontos e avisos do compilador para arquivos `.gs`. O código vive em
[packages/vscode](packages/vscode). A instalação pelo Marketplace depende da primeira publicação.

## O que não faz parte da v3

Balaios, debugger, módulos, sistema de tipos, LSP separado, níveis graduais, interop com JavaScript nativo e IR
própria **não fazem parte da v3**. Cada um só entra por RFC; veja o [CONTRIBUTING](CONTRIBUTING.md) e o
[ADR-0010](docs/adr/0010-fora-da-v3.md).

## Estrutura

```
goiasscript/
├── packages/
│   ├── language/    # vocabulário, diagnósticos e biblioteca padrão (dados)
│   ├── compiler/    # lexer, parser, análise e emissão
│   ├── optimizer/   # otimizações opcionais do JavaScript emitido
│   ├── cli/         # pacote npm da CLI e do REPL
│   └── vscode/      # extensão do VS Code
├── apps/
│   ├── playground/        # Next.js + Monaco
│   └── engoianador-api/   # Cloudflare Worker
├── docs/            # spec, ADRs e RFCs
└── tools/           # scanner de regras e testes de configuração
```

## Contribuindo

Veja o [CONTRIBUTING](CONTRIBUTING.md). Resumo: `corepack pnpm install`, `corepack pnpm verify` e commits no padrão
do [ADR-0008](docs/adr/0008-commits.md). Segurança: [SECURITY](SECURITY.md).

## Licença

[MIT](LICENSE).

---

*"Programar em goianês é prosa boa que vira código que roda."*
