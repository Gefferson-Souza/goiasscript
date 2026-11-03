// Analisador de texto: conta palavras e vogais e acha a palavra que mais aparece
uai paragrafo é "O pequi do cerrado é gostoso, e o goiano gosta de pequi. Uai, sô!"

faz_trem palavrasDe(texto) {
  faz_favor texto.cochichando().trocar(".", "").trocar(",", "").trocar("!", "").dividir(" ")
}

faz_trem contaVogais(texto) {
  trem total é 0
  vai_indo (uai letra de texto.cochichando()) {
    se_ocê_quiser ("aeiouáéíóúâêôãõ".tem_no_meio(letra)) {
      total é total mais 1
    }
  }
  faz_favor total
}

faz_trem maisComum(palavras) {
  uai contagem é {}
  vai_indo (uai palavra de palavras) {
    se_ocê_quiser (Coisa.tem(contagem, palavra)) {
      contagem[palavra] é contagem[palavra] mais 1
    } se_não {
      contagem[palavra] é 1
    }
  }
  trem melhor é ""
  vai_indo (uai palavra em contagem) {
    se_ocê_quiser (melhor é_igualim "" ou_então contagem[palavra] maior_que contagem[melhor]) {
      melhor é palavra
    }
  }
  faz_favor melhor mais " (" mais contagem[melhor] mais "x)"
}

uai palavras é palavrasDe(paragrafo)
prosa("Palavras:", palavras.o_tanto)
prosa("Vogais:", contaVogais(paragrafo))
prosa("Mais comum:", maisComum(palavras))
prosa(paragrafo.gritando())

uai frase é pergunta("Escreve uma frase pra eu inverter:")
tenta_aí {
  se_ocê_quiser (frase.ranca_os_espaço().o_tanto é_igualim 0) {
    vixe("a frase veio vazia")
  }
  prosa("Invertida:", frase.dividir(" ").de_trás_pra_frente().ajunta(" "))
} se_der_ruim (erro) {
  prosa("Deu ruim:", erro.mensagem)
} por_fim {
  prosa("Fui, sô!")
}
