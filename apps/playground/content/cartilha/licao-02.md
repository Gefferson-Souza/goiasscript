---
id: licao-02
order: 2
title: Guardando trem com uai e trem
summary: Aprende a guardar valor em constante e em variável, e que decimal é com ponto.
terms: [uai, trem]
exercise:
  prompt: "O preço veio com vírgula. Troca por ponto pra imprimir Preço: 10.5"
  starter: |
    uai preço é 10,50
    prosa("Preço: " mais preço)
  solution: |
    uai preço é 10.50
    prosa("Preço: " mais preço)
  expectedStdout: "Preço: 10.5"
---

# Guardando trem com uai e trem

Pra guardar um valor ocê dá um nome pra ele. Com `uai` o valor fica firme: não muda mais.
Com `trem` o valor pode mudar depois.

```goiasscript exemplo
uai nome é "Pequi"
trem contador é 1
contador é contador mais 1
prosa(nome)
prosa(contador)
```

Com número, o `mais` soma: `contador mais 1` dá 2. Tem também `menos`, `vezes` e `dividido`:

```goiasscript
prosa(6 dividido 2, 3 vezes 4, 10 menos 1)
```

Tentou mudar um `uai`? O compilador avisa que ele não muda. Se o valor muda, declara com `trem`:

```goiasscript erro-esperado GS0302
uai x é 1
x é 2
```

Decimal em GoiásScript se escreve com ponto, igual no JavaScript. A vírgula não entra
no meio de um número, e o compilador avisa ocê na hora:

```goiasscript erro-esperado GS0208
uai preço é 10,50
```

O jeito certo é assim:

```goiasscript
uai preço é 10.50
prosa(preço)
```

No exercício o preço veio com vírgula. Troca por ponto e roda.
