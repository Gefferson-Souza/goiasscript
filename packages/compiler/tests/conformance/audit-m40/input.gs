arruma_trem Pilha {
  aprepara_trem() { ocê.itens é []; }
  push(x) { ocê.itens.push(x); }
  find(pred) { faz_favor ocê.itens.find(pred); }
}
uai p é faz_um Pilha();
p.push(1);
p.push(2);
prosa(p.find(x => x maior_que 1));