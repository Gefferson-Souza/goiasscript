// Lista da feira de sábado: soma tudo e confere se cabe no bolso
trem lista é []

faz_trem bota(nome, quantidade, preco) {
  lista.bota_no_final({ nome: nome, quantidade: quantidade, preco: preco })
}

faz_trem tira(nome) {
  uai posicao é lista.onde_tá_o(item => item.nome é_igualim nome)
  se_ocê_quiser (posicao é_igualim -1) {
    prosa("Não tem", nome, "na lista")
    faz_favor
  }
  lista.ranca_do_meio(posicao, 1)
}

faz_trem subtotal(item) {
  faz_favor item.quantidade vezes item.preco
}

faz_trem dinheiro(valor) {
  faz_favor "R$ " mais valor.com_casas(2).trocar(".", ",")
}

bota("Pequi", 2, 7.5)
bota("Guariroba", 1, 4.25)
bota("Queijo", 3, 18)
bota("Pamonha", 4, 6)
bota("Mandioca", 5, 3.4)

tira("Mandioca")
tira("Abacaxi")

prosa("FEIRA DE SÁBADO")
vai_indo (uai item de lista) {
  prosa(item.nome, item.quantidade, "x", dinheiro(item.preco), "=", dinheiro(subtotal(item)))
}

uai caros é lista.filtrar(item => subtotal(item) maior_que 20)
prosa("Mais caros:", caros.mapear(item => item.nome).ajunta(", "))

uai gasto é lista.amontoar((soma, item) => soma mais subtotal(item), 0)
prosa("Total:", dinheiro(gasto))

uai orcamento é vira_número(pergunta("Quanto ocê tem pra gastar?"))
se_ocê_quiser (gasto no_máximo orcamento) {
  prosa("Cabe no bolso! Sobra", dinheiro(orcamento menos gasto))
} se_não {
  prosa("Passou", dinheiro(gasto menos orcamento), "do orçamento, tira alguma coisa.")
}
