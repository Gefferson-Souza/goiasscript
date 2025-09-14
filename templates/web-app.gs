// {{PROJECT_NAME}} - Aplicação Web GoiásScript v2.0
prosa("🚀 Carregando {{PROJECT_NAME}}...");

trem appConfig é {
  nome: "{{PROJECT_NAME}}",
  versao: "1.0.0",
  tipo: "Aplicação Web GoiásScript"
};

// Função para mostrar na página web
presta_serviço mostrarNaPagina(mensagem) {
  trem output é document.getElementById("output");
  se_ocê_quiser (output) {
    output.innerHTML = output.innerHTML mais "<div class='log-line'>" mais mensagem mais "</div>";
    output.scrollTop = output.scrollHeight;
  }
}

// Função principal da aplicação
presta_serviço iniciarApp() {
  mostrarNaPagina("🎉 " mais appConfig.nome mais " iniciado!");
  mostrarNaPagina("📦 Versão: " mais appConfig.versao);
  mostrarNaPagina("⚡ Powered by GoiásScript v2.0");
  
  trem tecnologias é ["GoiásScript", "JavaScript", "HTML5", "CSS3"];
  mostrarNaPagina("🛠️ Tecnologias:");
  
  vai_indo (trem i é 0; i menor_que tecnologias.tamanho(); i é i mais 1) {
    mostrarNaPagina("  • " mais tecnologias[i]);
  }
  
  trem numeroSorte é Math.floor(Math.random() * 1000);
  mostrarNaPagina("🎲 Número da sorte: " mais numeroSorte);
  mostrarNaPagina("✅ Aplicação carregada com sucesso!");
}

// Funções globais para HTML
se_ocê_quiser (typeof window diferente_de "undefined") {
  window.executarDemo = iniciarApp;
  window.limparOutput = presta_serviço() {
    document.getElementById("output").innerHTML = "";
    mostrarNaPagina("🧹 Output limpo!");
  };
  
  // Auto-iniciar quando carregado
  window.addEventListener("load", iniciarApp);
} se_não {
  // Quando executado no Node.js
  prosa("✅ " mais appConfig.nome mais " - Aplicação web criada!");
  prosa("💡 Para testar: npm run dev");
}