---
id: licao-03
order: 3
title: Texto e mais
summary: Junta pedaços de texto com mais e grita com gritando.
terms: [mais, gritando]
exercise:
  prompt: Junta as duas palavras com um espaço no meio e bota tudo em maiúscula.
  starter: |
    uai fruta é "pequi"
    uai lugar é "de Goiás"
    prosa(fruta)
  solution: |
    uai fruta é "pequi"
    uai lugar é "de Goiás"
    prosa((fruta mais " " mais lugar).gritando())
  expectedStdout: "PEQUI DE GOIÁS"
---

# Texto e mais

O `mais` junta um texto no outro. Fica de olho no espaço: ele só aparece se ocê
mandar ele junto.

```goiasscript exemplo
uai nome é "Pequi"
prosa("Bom dia, " mais nome mais "!")
```

O `.gritando()` devolve o texto em maiúscula:

```goiasscript
uai aviso é "cuidado com o espinho"
prosa(aviso.gritando())
```

No exercício, junta `fruta`, um espaço e `lugar`, e grita o resultado.
