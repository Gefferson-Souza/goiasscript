// {{projeto_nome}} - Arquivo principal
// Criado em: {{data_criacao}}

prosa("=== {{projeto_nome}} ===");
prosa("Bem-vindo ao seu projeto GoiásScript!");

// Variáveis básicas
uai nome_projeto é "{{projeto_nome}}";
uai versao é "1.0.0";

// Função de saudação
presta_serviço saudar(nome) {
  faz_favor "Opa, " mais nome mais "! Tudo certo aí?";
}

// Função principal
presta_serviço main() {
  prosa("Nome do projeto: " mais nome_projeto);
  prosa("Versão: " mais versao);
  
  uai mensagem = saudar("{{autor_nome}}");
  prosa(mensagem);
  
  prosa("Projeto rodando perfeitamente! 🎉");
}

// Executar função principal
main();