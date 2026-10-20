prosa("=== Programa GoiásScript ===")

vai_na_frente faz_trem testaDelay(tempo) {
  prosa("Esperando " + tempo + " milissegundos...")
  espera_um_cadim faz_um promessa((resolve_aí) => {
    daqui_a_pouco(() => {
      prosa("Tempo de espera concluído!")
      resolve_aí("Concluído após " mais tempo mais "ms")
    }, tempo)
  })
  faz_favor "Processamento de " mais tempo mais "ms finalizado!"
}

vai_na_frente faz_trem executar() {
  tenta_aí {
    prosa("Iniciando teste...")
    uai resultado é espera_um_cadim testaDelay(20)
    prosa("Resultado: " mais resultado)
    prosa("Teste concluído com sucesso!")
  } se_der_ruim (erro) {
    reclama("Erro durante execução: " mais erro)
  }
}

executar()
prosa("O programa principal continua executando enquanto a função assíncrona trabalha")

trem contador é 0
enquanto_tiver (contador menor_que 3) {
  prosa("Contando: " mais contador)
  contador é contador mais 1
}
