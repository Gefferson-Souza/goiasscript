// Conta no banco: depósito, saque, erro tratado e poupança que rende
arruma_trem ContaBanco {
  aprepara_trem(titular, saldo) {
    ocê.titular é titular
    ocê.saldo é saldo
  }
  deposita(valor) {
    ocê.saldo é ocê.saldo mais valor
  }
  saca(valor) {
    se_ocê_quiser (valor maior_que ocê.saldo) {
      vixe("saldo insuficiente, tem só " mais ocê.saldo.com_casas(2))
    }
    ocê.saldo é ocê.saldo menos valor
  }
  extrato() {
    prosa(ocê.titular, "tem", ocê.saldo.com_casas(2))
  }
}

arruma_trem Poupanca inherda_de ContaBanco {
  aprepara_trem(titular, saldo, taxa) {
    a_raiz(titular, saldo)
    ocê.taxa é taxa
  }
  rende() {
    ocê.deposita(ocê.saldo vezes ocê.taxa)
  }
}

uai ana é faz_um ContaBanco("Ana", 100)
uai beto é faz_um Poupanca("Beto", 1000, 0.01)

ana.deposita(50)
ana.extrato()

tenta_aí {
  ana.saca(500)
} se_der_ruim (erro) {
  prosa("Não deu:", erro.mensagem)
}

beto.rende()
beto.extrato()

vai_na_frente faz_trem transfere(origem, destino, valor) {
  espera_um_cadim cochila(10)
  origem.saca(valor)
  destino.deposita(valor)
  prosa("Transferiu", valor, "de", origem.titular, "pra", destino.titular)
}

vai_na_frente faz_trem principal() {
  espera_um_cadim transfere(beto, ana, 300)
  ana.extrato()
  beto.extrato()
}

principal()
