---
id: licao-05
order: 5
title: Laços
summary: Como mandar o programa repetir um trem sem escrever tudo de novo.
terms: [vai_indo, enquanto_tiver, para_com_isso, continua_aí]
exercise:
  prompt: Usa o vai_indo pra imprimir os números de 1 a 5, um por linha.
  starter: |
    vai_indo (trem i é 1; i menor_que 1; i é i mais 1) {
      prosa(i)
    }
  solution: |
    vai_indo (trem i é 1; i menor_que 6; i é i mais 1) {
      prosa(i)
    }
  expectedStdout: |
    1
    2
    3
    4
    5
---

# Laços

Tem hora que ocê precisa fazer o mesmo trem várias vezes. Em vez de copiar a linha, ocê usa um **laço**.

## vai_indo

O `vai_indo` tem três partes entre parênteses, separadas por ponto e vírgula: onde começa, até quando vai e como anda
a cada volta. O corpo fica sempre entre chaves.

```goiasscript exemplo
vai_indo (trem i é 1; i menor_que 4; i é i mais 1) {
  prosa(i)
}
```

O `i` começa em 1, enquanto for menor que 4 o corpo roda, e a cada volta o `i` ganha um. Por isso saem 1, 2 e 3.

## enquanto_tiver

Quando ocê não sabe quantas voltas vai dar, usa o `enquanto_tiver`: ele roda o corpo enquanto a condição for verdadeira.

```goiasscript
trem sobrou_agua é 3
enquanto_tiver (sobrou_agua maior_que 0) {
  prosa("Ainda tem água: " mais sobrou_agua)
  sobrou_agua é sobrou_agua menos 1
}
```

## para_com_isso e continua_aí

O `para_com_isso` larga o laço na hora. O `continua_aí` pula o resto da volta e vai pra próxima.

```goiasscript
vai_indo (trem i é 1; i menor_que 10; i é i mais 1) {
  se_ocê_quiser (i é_igualim 2) {
    continua_aí
  }
  se_ocê_quiser (i maior_que 4) {
    para_com_isso
  }
  prosa(i)
}
```

Aqui o 2 é pulado e o laço para quando o `i` passa de 4, então saem 1, 3 e 4.

## Cuidado com laço que nunca acaba

Se a condição nunca vira falsa, o laço roda pra sempre. No playground, o programa tem um limite de voltas: passou
dele, o programa para e aparece o aviso **GS0701** ("esse laço rodou demais"). Quando ele aparecer, olha a condição
do laço e confere se alguma coisa dentro do corpo faz ela mudar.

## Sua vez

Abre o exercício: o laço do `starter` não dá volta nenhuma. Muda a condição pra ele imprimir de 1 a 5.
