// {{projeto_nome}} - Aplicação Web GoiásScript
// Criado em: {{data_criacao}}

prosa("=== {{projeto_nome}} - Carregando... ===");

// Dados da aplicação
uai config é {
  nome: "{{projeto_nome}}",
  versao: "1.0.0", 
  autor: "{{autor_nome}}"
};

// Função para mostrar mensagem na página
presta_serviço mostrarNaPagina(mensagem) {
  trem elemento = document.getElementById("output");
  se (elemento) {
    elemento.innerHTML = elemento.innerHTML mais "<p>" mais mensagem mais "</p>";
  }
}

// Função de demonstração
presta_serviço executarDemo() {
  mostrarNaPagina("🚀 Iniciando demonstração GoiásScript...");
  
  // Variáveis goianas
  uai saudacao é "Opa, sô!";
  uai numeros é [1, 2, 3, 4, 5];
  
  mostrarNaPagina("Saudação: " mais saudacao);
  mostrarNaPagina("Lista de números: " mais numeros.junta(", "));
  
  // Testando métodos goianos
  uai texto_teste é "GoiásScript";
  mostrarNaPagina("Texto em maiúsculo: " mais texto_teste.gritando());
  mostrarNaPagina("Texto em minúsculo: " mais texto_teste.cochichando());
  
  // Loop goiano
  mostrarNaPagina("Contando até 3:");
  vai_indo (uai i é 1; i menor_ou_igual_a 3; i = i mais 1) {
    mostrarNaPagina("  Contagem: " mais i);
  }
  
  mostrarNaPagina("✅ Demonstração concluída!");
}

// Função para limpar saída
presta_serviço limparSaida() {
  trem elemento = document.getElementById("output");
  se (elemento) {
    elemento.innerHTML = "";
  }
  mostrarNaPagina("🧹 Saída limpa!");
}

// Quando a página carregar
se (typeof document diferente_de "undefined") {
  // Adicionar as funções ao escopo global para HTML poder chamá-las
  window.executarDemo = executarDemo;
  window.limparSaida = limparSaida;
  
  mostrarNaPagina("🎉 " mais config.nome mais " v" mais config.versao mais " carregado!");
  mostrarNaPagina("Desenvolvido por: " mais config.autor);
} senao {
  // Executando em ambiente Node.js para testes
  prosa("Aplicação web GoiásScript funcionando!");
  prosa("Para ver na web, execute: npm run dev");
}