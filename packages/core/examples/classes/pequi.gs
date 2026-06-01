// Classe Pequi: programação orientada a objeto, no jeito goiano.
// Usa função construtora (faz_trem) + self — padrão que o transpiler entende.

faz_trem Pequi(maturacao) {
  uai self é {};
  self.maturacao é maturacao || "verde";

  self.amadurecer é faz_trem() {
    self.maturacao é "maduro";
    prosa("O pequi amadureceu, sô! Tá no ponto de pôr no arroz.");
    faz_favor self;
  };

  self.descrever é faz_trem() {
    prosa("Pequi " mais self.maturacao mais ", com espinho: cuidado pra num se furar!");
    faz_favor self;
  };

  faz_favor self;
}

uai meuPequi é Pequi("verde");
meuPequi.descrever();
meuPequi.amadurecer();
meuPequi.descrever();
