---
id: licao-07
order: 7
title: Funções com faz_trem
summary: Dar nome a um pedaço de código pra usar quantas vezes quiser.
terms: [faz_trem, faz_favor]
exercise:
  prompt: Termina a função soma pra ela devolver a soma dos dois números e imprime a chamada soma(4, 5).
  starter: |
    faz_trem soma(a, b) {
      faz_favor 0
    }
    prosa(soma(4, 5))
  solution: |
    faz_trem soma(a, b) {
      faz_favor a mais b
    }
    prosa(soma(4, 5))
  expectedStdout: "9"
---

# Funções com faz_trem

Uma **função** é um pedaço de código com nome. Ocê escreve uma vez e chama quantas vezes precisar.

```goiasscript exemplo
faz_trem cumprimenta(nome) {
  faz_favor "Oi, " mais nome
}

prosa(cumprimenta("Pequi"))
prosa(cumprimenta("Goiás"))
```

O `faz_trem` abre a função: vem o nome, os parâmetros entre parênteses e o corpo entre chaves. O `faz_favor`
devolve o valor pra quem chamou. Depois do `faz_favor` a função acaba.

## Mais de um parâmetro

Os parâmetros ficam separados por vírgula, e na chamada os valores vêm na mesma ordem.

```goiasscript
faz_trem area(largura, altura) {
  faz_favor largura vezes altura
}

prosa(area(3, 4))
```

## Função sem faz_favor

Se a função não tem `faz_favor`, ela só faz o serviço e devolve `indefinido`.

```goiasscript
faz_trem anuncia(texto) {
  prosa("Atenção: " mais texto)
}

anuncia("tá chovendo")
```

## Sua vez

A função `soma` do `starter` sempre devolve 0. Muda o `faz_favor` pra ela devolver `a mais b`.
