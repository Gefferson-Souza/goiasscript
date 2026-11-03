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

## Veio do JavaScript?

Se ocê já mexeu com JavaScript, vai tropeçar em algumas palavras. O GoiásScript avisa na hora
e diz qual é a palavra goiana. A troca é essa:

- `true` vira `certeza` e `false` vira `de_jeito_nenhum`.
- `==` e `===` viram `é_igualim`, e `!=` vira `diferente`.
- `&&` vira `e_mais`, `||` vira `ou_então` e `!` vira `num_é`.
- `i++` vira `i é i mais 1`.

Por exemplo, pra somar 1 num `trem`:

```goiasscript
trem i é 0
i é i mais 1
prosa(i)
```

E o aviso, se ocê escrever do jeito antigo:

```goiasscript erro-esperado GS0404
uai x é 1
prosa(x == 1)
```

As palavras de comparar e juntar condição ficam na lição 4.

No exercício o preço veio com vírgula. Troca por ponto e roda.
