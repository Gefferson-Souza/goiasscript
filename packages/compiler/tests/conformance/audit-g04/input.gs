arruma_trem Animal {
  aprepara_trem(nome) { ocê.nome é nome; }
  falar() { faz_favor ocê.nome mais " faz barulho"; }
  num_muda criar(n) { faz_favor faz_um Animal(n); }
}
arruma_trem Cachorro inherda_de Animal {
  aprepara_trem(nome) { super(nome); }
  falar() { faz_favor super.falar() mais " - au"; }
}
prosa(faz_um Cachorro("Rex").falar());
prosa(Animal.criar("Tom").falar());
prosa(faz_um Cachorro("Rex") é_tipo_de Animal);