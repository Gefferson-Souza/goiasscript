// Função que decide: o que fazer com cada idade, sô.

faz_trem classifica(idade) {
  se_ocê_quiser (idade menor_que 12) {
    faz_favor "criança";
  } se_num_for (idade menor_que 60) {
    faz_favor "adulto";
  } se_não {
    faz_favor "ancião";
  }
}

trem contador é 0;
enquanto_tiver (contador menor_que 3) {
  uai idade é contador vezes 30;
  prosa(idade mais " anos: " mais classifica(idade));
  contador é contador mais 1;
}
