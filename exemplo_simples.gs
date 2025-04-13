// Exemplo simples em GoiásScript
prosa("=== Programa GoiásScript v2 ===");
prosa("Data atual: 2025-04-13 05:00:01");
prosa("Usuário: Gefferson-Souza");

// Função assíncrona para teste
vai_na_frente presta_serviço testaDelay(tempo) {
  prosa("Esperando " + tempo + " milissegundos...");
  
  // Simulação de operação assíncrona
  espera_um_cadim faz_um promessa((resolve_aí) => {
    setTimeout(() => {
      prosa("Tempo de espera concluído!");
      resolve_aí("Concluído após " + tempo + "ms");
    }, tempo);
  });
  
  faz_favor "Processamento de " + tempo + "ms finalizado!";
}

// Chamando função assíncrona
vai_na_frente presta_serviço executar() {
  tenta_aí {
    prosa("Iniciando teste...");
    
    uai resultado = espera_um_cadim testaDelay(1000);
    prosa("Resultado: " + resultado);
    
    prosa("Teste concluído com sucesso!");
  } se_der_ruim (erro) {
    reclama("Erro durante execução: " + erro);
  }
}

// Executar o teste
executar();

// Mostra que o programa ainda está executando
prosa("O programa principal continua executando enquanto a função assíncrona trabalha");

// Contador simples para mostrar que outras funções também funcionam
trem contador = 0;
enquanto_tiver (contador menor_que 3) {
  prosa("Contando: " + contador);
  contador = contador mais 1;
}