---
id: licao-04
order: 4
title: Decidindo com se_ocê_quiser
summary: Faz o programa escolher um caminho conforme a condição.
terms: [se_ocê_quiser, se_não, se_num_for]
exercise:
  prompt: Imprime Aprovado se a nota for 7 ou mais, Recuperação se for de 5 até 6, e Reprovado nas outras.
  starter: |
    uai nota é 6
    se_ocê_quiser (nota pelo_menos 7) {
      prosa("Aprovado")
    }
  solution: |
    uai nota é 6
    se_ocê_quiser (nota pelo_menos 7) {
      prosa("Aprovado")
    } se_num_for (nota pelo_menos 5) {
      prosa("Recuperação")
    } se_não {
      prosa("Reprovado")
    }
  expectedStdout: "Recuperação"
---

# Decidindo com se_ocê_quiser

O `se_ocê_quiser` roda o corpo só se a condição for verdadeira. O corpo vai sempre
entre chaves. O `se_não` pega o resto dos casos.

```goiasscript exemplo
uai idade é 20
se_ocê_quiser (idade maior_que 17) {
  prosa("Pode entrar")
} se_não {
  prosa("Ainda não, sô")
}
```

Pra mais de dois caminhos, usa o `se_num_for` no meio. Pra ver se dois valores são
iguais, usa `é_igualim`:

```goiasscript
uai cor é "verde"
se_ocê_quiser (cor é_igualim "azul") {
  prosa("Azul")
} se_num_for (cor é_igualim "verde") {
  prosa("Verde")
} se_não {
  prosa("Outra cor")
}
```

## Comparando valores

Pra comparar dois valores, o GoiásScript tem uma palavra pra cada jeito:

- `maior_que`: o da esquerda é maior.
- `menor_que`: o da esquerda é menor.
- `pelo_menos`: é maior ou igual.
- `no_máximo`: é menor ou igual.
- `é_igualim`: os dois são iguais.
- `diferente`: os dois são diferentes.

O resultado é sempre `certeza` (sim) ou `de_jeito_nenhum` (não). O `prosa` mostra esses dois como
`true` e `false`:

```goiasscript
uai nota é 5
prosa(nota maior_que 3, nota menor_que 3, nota pelo_menos 5)
prosa(nota no_máximo 4, nota é_igualim 5, nota diferente 5)
```

## Juntando condições

Dá pra juntar duas condições numa só:

- `e_mais`: as duas têm que ser verdadeiras.
- `ou_então`: basta uma ser verdadeira.
- `num_é`: vira do avesso (o que era `certeza` vira `de_jeito_nenhum`).

```goiasscript
uai idade é 20
prosa(idade maior_que 17 e_mais idade menor_que 60)
prosa(idade menor_que 10 ou_então idade é_igualim 20)
prosa(num_é (idade é_igualim 20))
```

Na hora de decidir, é o mesmo caminho de antes:

```goiasscript
uai idade é 20
se_ocê_quiser (idade pelo_menos 18 e_mais idade no_máximo 59) {
  prosa("Adulto")
}
```

No exercício, classifica a nota em três faixas: aprovado, recuperação e reprovado.
