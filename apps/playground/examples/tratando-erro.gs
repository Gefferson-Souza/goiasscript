// Quando o trem dá ruim, a gente pega o erro e segue a vida.

tenta_aí {
  vixe("quebrou o pote");
} se_der_ruim (erro) {
  prosa("Pegou o erro: " mais erro.mensagem);
} por_fim {
  prosa("Terminou, sô.");
}
