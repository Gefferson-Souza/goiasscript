arruma_trem Pequi {
  aprepara_trem(maturacao) {
    ocê.maturacao é maturacao ou_então "verde"
  }

  amadurecer() {
    ocê.maturacao é "maduro"
    prosa("O pequi amadureceu, sô! Tá no ponto de pôr no arroz.")
    faz_favor ocê
  }

  descrever() {
    prosa("Pequi " mais ocê.maturacao mais ", com espinho: cuidado pra num se furar!")
    faz_favor ocê
  }
}

uai meuPequi é faz_um Pequi("verde")
meuPequi.descrever()
meuPequi.amadurecer()
meuPequi.descrever()
