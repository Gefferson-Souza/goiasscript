# GoiásScript: programar em goianês

> A linguagem de programação que fala igual goiano e ainda te corrige com jeitinho, uai!

GoiásScript é uma linguagem para aprender a programar escrevendo do jeito que o goiano fala: `uai` guarda um
valor, `prosa` mostra na tela e `faz_trem` cria uma função. O compilador (o programa que traduz o seu código) vira
tudo em JavaScript, a linguagem que o navegador e o Node entendem. E quando ocê escorrega, ele avisa em goianês.

[![CI](https://github.com/Gefferson-Souza/goiasscript/actions/workflows/ci.yml/badge.svg)](https://github.com/Gefferson-Souza/goiasscript/actions/workflows/ci.yml)
[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)

## Em 10 segundos

```goiasscript
uai nome é "Goiás"
prosa("Bem-vindo ao", nome)
```

```text
Bem-vindo ao Goiás
```

Agora erra o nome da variável de propósito:

```goiasscript erro-esperado GS0301
uai nome é "Goiás"
prosa("Bem-vindo ao", nomi)
```

```text
oi.gs:2:23: erro GS0301: Esse trem "nomi" não existe por aqui. Cê quis dizer "nome"?
2 | prosa("Bem-vindo ao", nomi)
  |                       ^^^^
  lição: Guardando trem com uai e trem (cartilha, licao-02)
```

Escreveu JavaScript sem querer? Ele percebe:

```goiasscript erro-esperado GS0403
console.log("Bão, sô!")
```

```text
js.gs:1:1: erro GS0403: Ô sô, "console" é do JavaScript. Aqui a gente fala "prosa".
1 | console.log("Bão, sô!")
  | ^^^^^^^
  lição: Guardando trem com uai e trem (cartilha, licao-02)
```

Todo erro diz a linha, a coluna, o que fazer e qual lição da cartilha explica o assunto.

## Instalar

Precisa do [Node](https://nodejs.org) (o programa que executa JavaScript no seu computador), versão 22.12 ou mais
nova.

A v3 ainda não saiu no npm: hoje o `npm install --global goiasscript` instala a v2 arquivada, que é outra
linguagem. Para testar a v3 agora, instale a partir do código:

```bash
git clone https://github.com/Gefferson-Souza/goiasscript.git
cd goiasscript
corepack pnpm install
corepack pnpm pack:cli
npm install --global ./packages/cli/pack/goiasscript-*.tgz
```

Quando a v3 sair, basta `npm install --global goiasscript`.

## Início rápido

Crie um projeto, entre nele e bote o programa pra moer (executar):

```bash
goiasscript arma_o_barraco meu-projeto
cd meu-projeto
goiasscript bota_pra_moer main.gs
```

Um programa um pouco maior:

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

```text
Bem-vindo ao Goiás
Dobrados: [ 2, 4, 6, 8, 10 ]
Eai Goiás, tudo beleza?
```

## O que cada palavra quer dizer

| Em goianês | Quer dizer | Em JavaScript |
| --- | --- | --- |
| `uai x é 1` | guarda 1 em `x`, e ele não muda mais | `const x = 1` |
| `trem x é 1` | guarda 1 em `x`, e ele pode mudar depois | `let x = 1` |
| `prosa(...)` | mostra na tela | `console.log(...)` |
| `faz_trem nome() { }` | cria uma função | `function nome() { }` |
| `faz_favor valor` | devolve o resultado da função | `return valor` |
| `mais`, `menos`, `vezes`, `dividido` | conta (e `mais` também junta texto) | `+`, `-`, `*`, `/` |
| `maior_que`, `menor_que`, `pelo_menos`, `no_máximo` | compara | `>`, `<`, `>=`, `<=` |
| `é_igualim`, `diferente` | igual, diferente | `===`, `!==` |
| `se_ocê_quiser` / `se_não` | se / senão | `if` / `else` |
| `vai_indo`, `enquanto_tiver` | repete | `for`, `while` |
| `certeza`, `de_jeito_nenhum`, `nada` | verdadeiro, falso, vazio | `true`, `false`, `null` |

A lista completa fica na [referência](docs/spec/referencia.md), e os métodos goianos de texto e de lista
(`.gritando()`, `.bota_no_final()`, `.filtrar()` e outros), com exemplo que roda, ficam em
[METODOS_GOIANOS](docs/METODOS_GOIANOS.md).

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

```text
Maior de idade
Volta 0
Volta 1
Volta 2
```

Quer ver programa inteiro? A pasta [`exemplos/`](exemplos/) tem cinco: a nota do churrasco, a lista da feira, o
boletim da turma, a conta no banco e um analisador de texto. Todos rodam de verdade, e a saída de cada um é conferida
a cada mudança no projeto.

## Como vira JavaScript

`goiasscript traduz main.gs` gera o `main.mjs`. Cada linha do seu `.gs` vira uma linha de JavaScript, então
ocê aprende JavaScript falando goianês. Quando um método goiano não tem igual no JavaScript, a função que faz o
serviço vai pro fim do arquivo, sem mexer nas suas linhas:

```goiasscript
uai nome é "Goiás"
prosa("Bem-vindo ao", nome)
```

```js
const nome = "Goiás";
console.log("Bem-vindo ao", nome);
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `goiasscript bota_pra_moer arquivo.gs` | traduz e já executa o programa |
| `goiasscript traduz arquivo.gs` | vira o `.gs` em JavaScript (`.mjs`) |
| `goiasscript vê_se_tá_certo arquivo.gs` | só confere o programa e mostra todos os problemas |
| `goiasscript explica GS0301` | explica um erro, com exemplo e lição |
| `goiasscript arma_o_barraco nome` | cria um projeto novo a partir do modelo |
| `goiasscript dedo_de_prosa` | mostra a versão e umas informações |
| `goias` | abre a roda de prosa: ocê digita uma linha e ele responde na hora |

Na roda de prosa, `.desenrola` mostra os comandos dela: `.mostra_os_trem` (o que tá guardado), `.lembra_aí` (o que
ocê já digitou), `.limpa_o_terreiro` (limpa a tela), `.zera_o_trem` (começa de novo) e `.vaza` (sai).

Todos aceitam a escrita sem acento (`ve_se_ta_certo`). O README da
[CLI `goiasscript`](packages/cli/README.md) detalha as opções.

## Engoianador: português comum vira goianês

Já está no ar. Experimente agora:

```bash
curl -s -X POST https://engoianador-api.goiasscript.workers.dev/engoiana \
  -H 'Content-Type: application/json' \
  -d '{"text":"Olá, tudo bem? Vamos tomar um café?"}'
```

```text
{"text":"Ô sô, tudo bão? Vamo tomá um café, uai?"}
```

A resposta vem de um modelo de linguagem, então pode mudar um pouco a cada vez. Tem um limite de pedidos por dia
para cada rede. A tela do Engoianador entra no playground quando ele for publicado.

## Playground e cartilha

O playground é um editor no navegador que compila e executa goianês ali mesmo, sem servidor. Ele traz a cartilha:
11 lições curtas, do primeiro `prosa` até perguntar coisa pra quem usa, cada uma com exercício. Ele ainda não tem endereço
público; para abrir na sua máquina:

```bash
corepack pnpm playground:dev
```

## Extensão do VS Code

Realce de sintaxe, trechos prontos e os avisos do compilador em goianês enquanto ocê digita. Ela ainda não está no
Marketplace; o [README da extensão](packages/vscode/README.md) mostra como instalar a partir do código.

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
├── exemplos/        # programas inteiros, com a saída conferida
├── docs/            # spec, ADRs e RFCs
└── tools/           # scanner de regras e testes de configuração
```

## Contribuindo

Veja o [CONTRIBUTING](CONTRIBUTING.md). Resumo: `corepack pnpm install`, `corepack pnpm verify` e commits no padrão
do [ADR-0008](docs/adr/0008-commits.md). Achou uma falha de segurança? Veja o [SECURITY](SECURITY.md).

## Licença

[MIT](LICENSE).

---

*"Programar em goianês é prosa boa que vira código que roda."*
