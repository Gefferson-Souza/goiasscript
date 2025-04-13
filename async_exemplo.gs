// Exemplos de operações assíncronas em GoiásScript
prosa("=== Teste de GoiásScript Assíncrono ===");
prosa("Data atual: 2025-04-13 04:56:54");
prosa("Usuário: Gefferson-Souza");

// Simulando uma operação assíncrona (tempo de espera)
presta_serviço esperaUmPoquim(tempo) {
  faz_favor faz_um promessa((resolve_aí) => {
    prosa("Esperando " + tempo + "ms...");
    setTimeout(() => {
      resolve_aí("Esperei " + tempo + "ms");
    }, tempo);
  });
}

// Uso básico de Promise
esperaUmPoquim(1000)
  .quando_resolver((mensagem) => {
    prosa("Promise resolvida: " + mensagem);
  })
  .se_der_pobrema((erro) => {
    reclama("Deu ruim: " + erro);
  });

// Função assíncrona com await
vai_na_frente_presta_serviço pegaDados() {
  prosa("Buscando dados...");
  
  uai resultado1 = espera_um_cadim esperaUmPoquim(1500);
  prosa("Primeiro resultado: " + resultado1);
  
  uai resultado2 = espera_um_cadim esperaUmPoquim(1000);
  prosa("Segundo resultado: " + resultado2);
  
  faz_favor {
    mensagem: "Tudo certo!",
    hora: faz_um Date().toISOString()
  };
}

// Exemplo com Async/Await
vai_na_frente_presta_serviço executaTudo() {
  tenta_aí {
    prosa("Começando processo...");
    
    uai dados = espera_um_cadim pegaDados();
    prosa("Recebeu dados: " + JSON.stringify(dados));
    
    uai maisUmTrem = espera_um_cadim faz_um promessa((resolve_aí) => {
      setTimeout(() => resolve_aí("Última tarefa concluída"), 800);
    });
    
    prosa(maisUmTrem);
    prosa("Processamento finalizado!");
    
  } se_der_ruim (erro) {
    reclama("Vixe, deu erro: " + erro);
  }
}

// Função para processar várias promessas em paralelo
vai_na_frente_presta_serviço processaVariosTrem() {
  uai tarefas = [
    esperaUmPoquim(700),
    esperaUmPoquim(500),
    esperaUmPoquim(1200)
  ];
  
  prosa("Executando várias tarefas ao mesmo tempo...");
  uai resultados = espera_um_cadim promessa.all(tarefas);
  
  prosa("Todas as tarefas terminaram!");
  vai_indo (trem i = 0; i menor_que resultados.length; i = i mais 1) {
    prosa("Resultado " + (i mais 1) + ": " + resultados[i]);
  }
}

// Executar o código assíncrono
executaTudo();
processaVariosTrem();

// Mostrar que o código continua executando
prosa("O programa continua executando enquanto as tarefas assíncronas rodam");