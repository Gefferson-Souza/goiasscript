---
id: licao-09
order: 9
title: Classes e herança
summary: Como uma classe filha herda da mãe e chama ela com a_raiz.
terms: [arruma_trem, a_raiz, inherda_de, aprepara_trem]
exercise:
  prompt: Termina a classe Pequi, que herda de Fruta. O descreve do Pequi chama o da Fruta com a_raiz e acrescenta " do cerrado". Depois cria um Pequi e imprime o que ele descreve.
  starter: |
    arruma_trem Fruta {
      aprepara_trem(nome) {
        ocê.nome é nome
      }
      descreve() {
        faz_favor "Fruta: " mais ocê.nome
      }
    }
    // Falta o Pequi: ele herda de Fruta e passa "Pequi" pra raiz
  solution: |
    arruma_trem Fruta {
      aprepara_trem(nome) {
        ocê.nome é nome
      }
      descreve() {
        faz_favor "Fruta: " mais ocê.nome
      }
    }
    arruma_trem Pequi inherda_de Fruta {
      aprepara_trem() {
        a_raiz("Pequi")
      }
      descreve() {
        faz_favor a_raiz.descreve() mais " do cerrado"
      }
    }
    uai pequi é faz_um Pequi()
    prosa(pequi.descreve())
  expectedStdout: "Fruta: Pequi do cerrado"
---

# Classes e herança

Classe é a forma do trem: ela diz o que cada coisa criada dela tem e sabe fazer. Em goianês, a classe sai com `arruma_trem`, e o `aprepara_trem` é o que roda quando ocê cria uma coisa nova com `faz_um`. Dentro dele, `ocê` é a própria coisa.

```goiasscript exemplo
arruma_trem Fruta {
  aprepara_trem(nome) {
    ocê.nome é nome
  }
  descreve() {
    faz_favor "Fruta: " mais ocê.nome
  }
}
uai manga é faz_um Fruta("Manga")
prosa(manga.descreve())
```

## Herdando de outra classe

Quando uma classe é parecida com outra, ela `inherda_de` a mãe e aproveita o que já tá pronto. A filha pode chamar a mãe com `a_raiz`:

- `a_raiz(...)` dentro do `aprepara_trem` roda o `aprepara_trem` da mãe. Chama ele antes de usar `ocê`.
- `a_raiz.metodo(...)` chama um método da mãe, mesmo que a filha tenha um com o mesmo nome.

```goiasscript
arruma_trem Fruta {
  aprepara_trem(nome) {
    ocê.nome é nome
  }
  descreve() {
    faz_favor "Fruta: " mais ocê.nome
  }
}
arruma_trem Manga inherda_de Fruta {
  aprepara_trem() {
    a_raiz("Manga")
  }
  descreve() {
    faz_favor a_raiz.descreve() mais " doce"
  }
}
prosa(faz_um Manga().descreve())
```

## Dois jeitos de errar

Cada classe só tem um `aprepara_trem`. Se ocê botar dois, o sô avisa:

```goiasscript erro-esperado GS0310
arruma_trem Fruta {
  aprepara_trem() { }
  aprepara_trem() { }
}
```

E `a_raiz` só vale em classe que herda. Solto por aí, ele não tem mãe pra chamar:

```goiasscript erro-esperado GS0311
uai x é a_raiz(1)
```

## Agora é com ocê

Termina o Pequi no exercício: ele herda de `Fruta`, passa `"Pequi"` pra raiz e faz o `descreve` chamar o da mãe com `a_raiz`.
