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

No exercício, classifica a nota em três faixas: aprovado, recuperação e reprovado.
