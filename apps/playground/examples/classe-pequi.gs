// Classe Pequi: orientação a objeto no jeito goiano.

arruma_trem Pequi {
  aprepara_trem(maturacao) {
    ocê.maturacao é maturacao;
  }

  amadurecer() {
    ocê.maturacao é "maduro";
    faz_favor ocê;
  }

  descrever() {
    prosa("Pequi " mais ocê.maturacao mais ", com espinho: cuidado pra num se furar!");
    faz_favor ocê;
  }
}

uai meuPequi é faz_um Pequi("verde");
meuPequi.descrever();
meuPequi.amadurecer().descrever();
