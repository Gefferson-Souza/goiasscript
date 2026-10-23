---
id: licao-08
order: 8
title: Coisas
summary: Juntar informações com nome numa coisa só e andar por elas.
terms: [de, em, Coisa]
exercise:
  prompt: Muda o preço da fruta pra 8 antes de imprimir.
  starter: |
    uai fruta é { nome: "Pequi", preco: 5 }
    prosa(fruta.nome mais ": " mais fruta.preco)
  solution: |
    uai fruta é { nome: "Pequi", preco: 5 }
    fruta.preco é 8
    prosa(fruta.nome mais ": " mais fruta.preco)
  expectedStdout: "Pequi: 8"
---

# Coisas

Uma **coisa** guarda informações com nome, no formato `chave: valor`. Ocê lê cada campo com ponto.

```goiasscript exemplo
uai pessoa é { nome: "Maria", idade: 30 }
prosa(pessoa.nome)
pessoa.idade é 31
prosa(pessoa.idade)
```

Mesmo a coisa sendo `uai`, ocê pode mudar um campo dela: o que o `uai` trava é trocar a coisa inteira por outra.

## Nomes que não servem

A chave não pode ser uma palavra do JavaScript, como `new` ou `class`, nem um nome que a linguagem já usa pra
outra finalidade, como `mensagem` em erro ou `o_tanto` em lista. Escolhe um nome do seu dia a dia, tipo `preco`, `ano` ou `nome`.

## Andando pelas chaves com em

O `vai_indo` com `em` passa por cada chave da coisa.

```goiasscript
uai carro é { marca: "Fiat", cor: "azul" }
vai_indo (uai campo em carro) {
  prosa(campo mais " = " mais carro[campo])
}
```

## Andando pelos itens com de

O `de` anda pelos itens de uma lista, um de cada vez.

```goiasscript
vai_indo (uai fruta de ["pequi", "guariroba"]) {
  prosa(fruta)
}
```

## A Coisa da biblioteca

A `Coisa` tem umas ajudas pra mexer com coisas. A `Coisa.chaves` devolve a lista com as chaves.

```goiasscript
uai bicho é { nome: "Tatu", patas: 4 }
prosa(Coisa.chaves(bicho).ajunta(", "))
```

## Sua vez

O `starter` imprime o preço 5. Muda o campo `preco` pra 8 antes do `prosa`.
