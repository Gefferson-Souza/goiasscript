---
id: licao-11
order: 11
title: Perguntar e esperar
summary: Como perguntar pro usuário, virar a resposta em número e esperar um trem demorado.
terms: [pergunta, espera_um_cadim, vira_número]
exercise:
  prompt: Pergunta o preço, vira a resposta em número e imprime. A resposta vem com vírgula (10,50). O frete é 1.000,50 e no starter ele tá com vírgula, o que o sô avisa. Troca por ponto.
  starter: |
    uai preço é vira_número(pergunta("Quanto custa?"))
    prosa("Preço:", preço, "Frete:", 1.000,50)
  solution: |
    uai preço é vira_número(pergunta("Quanto custa?"))
    prosa("Preço:", preço, "Frete:", 1000.50)
  expectedStdout: "Quanto custa? Preço: 10.5 Frete: 1000.5"
  stdinFile: stdin/licao-11.txt
---

# Perguntar e esperar

`pergunta("texto")` mostra o texto, espera o usuário responder e devolve o que ele escreveu. A resposta vem sempre como texto, mesmo que ele digite um número.

Por exemplo, `uai nome é pergunta("Qual o seu nome?")` guarda em `nome` o que o usuário escreveu. Se a entrada acabar antes da resposta, o programa para avisando que acabou a entrada.

## Virando número

Pra fazer conta, a resposta precisa virar número. O `vira_número` faz isso e ainda entende a vírgula do jeito que o povo escreve: `"10,50"` vira `10.5`. Se o texto não for número, dá `NaN`.

```goiasscript
uai preço é vira_número("10,50")
prosa(preço mais 1)
```

## Esperando um trem demorado

Alguns trem não respondem na hora, como buscar coisa na internet. Esses devolvem uma `Promessa`. O `espera_um_cadim` segura o programa até a promessa se resolver, e só vale dentro de uma função marcada com `vai_na_frente`.

```goiasscript exemplo
vai_na_frente faz_trem busca() {
  uai resultado é espera_um_cadim faz_um Promessa((resolve_aí) => resolve_aí(7))
  prosa("Veio:", resultado)
}
busca()
```

## Decimal é com ponto no código

A resposta do usuário pode ter vírgula, que o `vira_número` aceita. Mas número escrito no código é com ponto. Se ocê escreve `1.000,50` num argumento, o sô avisa:

```goiasscript erro-esperado GS0805
prosa("Frete:", 1.000,50)
```

## Agora é com ocê

Roda o exercício: a resposta `10,50` já vem preparada. Troca a vírgula do frete por ponto.
