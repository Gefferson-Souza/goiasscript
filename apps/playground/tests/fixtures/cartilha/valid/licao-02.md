---
id: licao-02
order: 2
title: Perguntando o nome
summary: Como o programa escuta ocê.
terms: [pergunta, uai]
exercise:
  prompt: Pergunta o nome e cumprimenta.
  starter: |
    uai nome é pergunta("Nome?")
  solution: |
    uai nome é pergunta("Nome?")
    prosa("Oi, " mais nome)
  expectedStdout: "Nome? Oi, Pequi"
  stdinFile: stdin/licao-02.txt
---

# Perguntando o nome

```goiasscript exemplo
uai nome é pergunta("Nome?")
prosa(nome)
```

```goiasscript erro-esperado GS0208
uai preço é 10,50
```
