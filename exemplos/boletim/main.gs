// Boletim da turma: média, situação e a melhor nota
arruma_trem Aluno {
  aprepara_trem(nome, notas) {
    ocê.nome é nome
    ocê.notas é notas
  }
  media() {
    uai soma é ocê.notas.amontoar((total, nota) => total mais nota, 0)
    faz_favor soma dividido ocê.notas.o_tanto
  }
  situacao() {
    uai m é ocê.media()
    se_ocê_quiser (m pelo_menos 7) {
      faz_favor "aprovado"
    } se_num_for (m pelo_menos 5) {
      faz_favor "recuperação"
    }
    faz_favor "reprovado"
  }
}

uai turma é [
  faz_um Aluno("Maria", [9, 8.5, 10]),
  faz_um Aluno("João", [6, 5, 5.5]),
  faz_um Aluno("Zé", [3, 4, 2.5]),
  faz_um Aluno("Ana", [7, 7.5, 6.5])
]

prosa("=== Boletim da turma ===")
vai_indo (uai aluno de turma) {
  prosa(aluno.nome, "- média", aluno.media().com_casas(1), "-", aluno.situacao())
}

faz_trem oMelhor(campeao, aluno) {
  se_ocê_quiser (aluno.media() maior_que campeao.media()) {
    faz_favor aluno
  }
  faz_favor campeao
}

uai melhor é turma.amontoar(oMelhor, turma[0])
prosa("Melhor média:", melhor.nome.gritando(), "mandou bem demais, uai!")

uai aprovados é turma.filtrar(aluno => aluno.situacao() é_igualim "aprovado")
prosa("Aprovados:", aprovados.o_tanto, "de", turma.o_tanto)
