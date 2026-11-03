// Quanto comprar e quanto vai custar o churrasco
uai convidados é { adultos: 9, criancas: 3 }

uai itens é [
  { nome: "Carne", unidade: "kg", preco: 45.90, adulto: 0.4, crianca: 0.2 },
  { nome: "Linguiça", unidade: "kg", preco: 22.50, adulto: 0.15, crianca: 0.05 },
  { nome: "Pão de alho", unidade: "un", preco: 4, adulto: 2, crianca: 1 },
  { nome: "Refrigerante", unidade: "L", preco: 7.5, adulto: 1, crianca: 0.8 }
]

faz_trem dinheiro(valor) {
  faz_favor "R$ " mais valor.com_casas(2).trocar(".", ",")
}

faz_trem quantidade(item) {
  uai total é item.adulto vezes convidados.adultos mais item.crianca vezes convidados.criancas
  se_ocê_quiser (item.unidade é_igualim "un") {
    faz_favor Conta.arredondar_pra_cima(total)
  }
  faz_favor total
}

faz_trem mostra(qtd, unidade) {
  se_ocê_quiser (unidade é_igualim "un") {
    faz_favor qtd mais " un"
  }
  faz_favor qtd.com_casas(1) mais " " mais unidade
}

uai gente é convidados.adultos mais convidados.criancas
prosa("=".repete(36))
prosa("NOTA DO CHURRASCO -", gente, "convidados")
prosa("=".repete(36))

trem total é 0
vai_indo (uai item de itens) {
  uai qtd é quantidade(item)
  uai custo é qtd vezes item.preco
  total é total mais custo
  prosa(item.nome, mostra(qtd, item.unidade), "->", dinheiro(custo))
}

prosa("-".repete(36))
prosa("Total:", dinheiro(total))
prosa("Por pessoa:", dinheiro(total dividido gente))
