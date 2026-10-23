---
id: licao-06
order: 6
title: Listas
summary: Guardar vários trem juntos, aumentar a lista e mexer em todos de uma vez.
terms: [mapear, filtrar, bota_no_final, o_tanto]
exercise:
  prompt: Dobra os números da lista e deixa só os maiores que 5. Imprime o resultado separado por vírgula.
  starter: |
    uai numeros é [1, 2, 3, 4, 5]
    uai dobrados é numeros.mapear(n => n vezes 2)
    prosa(dobrados.ajunta(", "))
  solution: |
    uai numeros é [1, 2, 3, 4, 5]
    uai dobrados é numeros.mapear(n => n vezes 2)
    uai grandes é dobrados.filtrar(n => n maior_que 5)
    prosa(grandes.ajunta(", "))
  expectedStdout: "6, 8, 10"
---

# Listas

Uma **lista** guarda vários valores na ordem, entre colchetes e separados por vírgula.

```goiasscript exemplo
uai frutas é ["pequi", "guariroba"]
frutas.bota_no_final("cagaita")
prosa(frutas.o_tanto)
prosa(frutas.ajunta(", "))
```

O `bota_no_final` põe um item no fim da lista. O `o_tanto` diz quantos itens ela tem, e repara que ele não leva
parênteses. O `ajunta` cola os itens num texto só, com o separador que ocê escolher.

## mapear

O `mapear` pega uma função e aplica em cada item, devolvendo uma lista nova do mesmo tamanho.

```goiasscript
uai precos é [2, 4, 6]
uai com_desconto é precos.mapear(preco => preco menos 1)
prosa(com_desconto.ajunta(" "))
```

A lista `precos` continua do jeito que estava: o `mapear` não mexe nela.

## filtrar

O `filtrar` também pega uma função, mas guarda só os itens em que ela dá `certeza`.

```goiasscript
uai idades é [12, 18, 30, 7]
uai adultos é idades.filtrar(idade => idade pelo_menos 18)
prosa(adultos.ajunta(" "))
```

Dá pra encadear: o resultado do `mapear` é uma lista, então ele aceita um `filtrar` em seguida.

## Sua vez

O `starter` já dobra os números. Falta deixar só os maiores que 5 antes de imprimir.
