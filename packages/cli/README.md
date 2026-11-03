# GoiásScript

Linguagem de programação em goianês que vira JavaScript, uai!

## Instalar

Precisa do Node 22.12 ou mais novo.

A v3 ainda não foi publicada no npm. Hoje o `npm install --global goiasscript` instala a 2.0.0, que é a v2
arquivada, outra linguagem. Não use esse comando pra testar a v3.

Pra testar a v3 agora, instale a partir do código:

```bash
git clone https://github.com/Gefferson-Souza/goiasscript.git
cd goiasscript
corepack pnpm install
corepack pnpm pack:cli
npm install --global ./packages/cli/pack/goiasscript-*.tgz
```

Quando a primeira alpha da v3 sair, ela vai pela etiqueta `next` do npm, e o comando vai ser:

```bash
npm install --global goiasscript@next
```

Pra só experimentar, sem instalar nada, depois que a alpha sair: `npx goiasscript@next dedo_de_prosa`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `goiasscript traduz arquivo.gs` | vira o `.gs` em JavaScript (`.mjs`) |
| `goiasscript bota_pra_moer arquivo.gs` | traduz e já executa o programa |
| `goiasscript vê_se_tá_certo arquivo.gs` | só confere o programa e mostra todos os problemas |
| `goiasscript arma_o_barraco nome` | cria um projeto novo a partir do modelo |
| `goiasscript explica GS0301` | explica um erro com exemplo e lição |
| `goiasscript dedo_de_prosa` | mostra a versão e umas informações |

Dá pra digitar sem acento: `ve_se_ta_certo` funciona igual.

Opções do `traduz`: `-s saida.mjs` escolhe o arquivo de saída, `--otimiza` deixa o JavaScript mais enxuto,
`--minifica` aperta até não caber mais nada, `--sobrescreve` troca um arquivo que já existe e `--json` entrega os
diagnósticos pra outras ferramentas.

O `--otimiza` e o `--minifica` não andam juntos: se usar os dois, dá o erro GS0905. Escolhe um.

Vale pra todos os comandos: `--tom raiz` (o padrão) ou `--tom neutro` escolhe o tom do texto que o programa mostra.

## Roda de prosa (REPL)

```bash
goias
```

Dentro da roda de prosa, digite o código e aperte Enter. Pra sair, `.vaza` ou duas vezes Ctrl+C.

## Usar como biblioteca

```js
import { compile } from 'goiasscript';

const resultado = compile('prosa("Olá, mundo")');
if (resultado.ok) console.log(resultado.code);
```

A API exporta `compile`, `explainDiagnostic`, `translateRuntimeError` e `optimize`, com os tipos incluídos.
