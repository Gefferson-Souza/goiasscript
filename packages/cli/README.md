# GoiásScript

Linguagem de programação em goianês que vira JavaScript, uai!

## Instalar

Precisa do Node 22.12 ou mais novo.

```bash
npm install --global goiasscript
```

Pra só experimentar, sem instalar nada:

```bash
npx goiasscript dedo_de_prosa
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

Dá pra digitar sem acento: `ve_se_ta_certo` funciona igual.

Opções do `traduz`: `-s saida.mjs` escolhe o arquivo de saída, `--otimiza` deixa o JavaScript mais enxuto,
`--minifica` aperta até não caber mais nada, `--sobrescreve` troca um arquivo que já existe e `--json` entrega os
diagnósticos pra outras ferramentas.

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
