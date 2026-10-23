---
id: licao-10
order: 10
title: Quando dá ruim
summary: Como pegar um erro com tenta_aí e se_der_ruim, e como soltar um com vixe.
terms: [tenta_aí, se_der_ruim, por_fim, vixe]
exercise:
  prompt: Chama o.a() num objeto onde a é um número, pega o erro e imprime só a mensagem dele.
  starter: |
    tenta_aí {
      uai o é { a: 1 }
      o.a()
    } se_der_ruim (erro) {
      // imprime a mensagem do erro aqui
    }
  solution: |
    tenta_aí {
      uai o é { a: 1 }
      o.a()
    } se_der_ruim (erro) {
      prosa(erro.mensagem)
    }
  expectedStdout: "Ô sô, deu erro de tipo: um valor não foi usado do jeito certo."
---

# Quando dá ruim

Programa dá ruim, é do jogo. O que importa é não deixar o trem cair de vez. Pra isso tem o `tenta_aí`: ocê bota o que pode dar errado dentro dele e, se der, o `se_der_ruim` pega o erro.

```goiasscript exemplo
tenta_aí {
  prosa("Tentando...")
  vixe("Deu ruim")
} se_der_ruim (erro) {
  prosa("Peguei:", erro.mensagem)
} por_fim {
  prosa("Isso roda de qualquer jeito")
}
```

## As três partes

- `tenta_aí` é o bloco que ocê quer experimentar.
- `se_der_ruim (erro)` só roda se der erro lá em cima. O `erro` é o parâmetro com o que aconteceu.
- `por_fim` roda sempre, deu certo ou não. É bom pra arrumar a casa.

## Soltando um erro

`vixe("mensagem")` joga um erro de propósito. O programa para ali, a não ser que tenha um `tenta_aí` esperando.

## Erro do motor já vem em português

Quando o próprio motor reclama (um tipo errado, um nome que não existe), a `erro.mensagem` já vem em goianês, sem ocê traduzir nada.

## Não passa o erro inteiro

Passar o `erro` direto pro `prosa` não mostra o que ocê quer. Pega a mensagem:

```goiasscript erro-esperado GS0807
tenta_aí {
  vixe("a")
} se_der_ruim (erro) {
  prosa(erro)
}
```

## Agora é com ocê

Termina o exercício: o `o.a()` vai dar erro de tipo, e ocê imprime só a `erro.mensagem`.
