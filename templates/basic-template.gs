// {{PROJECT_NAME}} - GoiásScript v2.0
// Arquivo principal do projeto

prosa("=== Projeto {{PROJECT_NAME}} ===");
prosa("GoiásScript v2.0 funcionando!");

uai mensagem é "Oi sô! Seu projeto tá rodando perfeitamente!";
prosa(mensagem);

uai tecnologias é ["GoiásScript", "JavaScript", "Node.js"];
prosa("Tecnologias:");

vai_indo (trem i é 0; i menor_que tecnologias.tamanho(); i = i mais 1) {
  prosa("• " mais tecnologias[i]);
}

trem numero_sorte = Math.floor(Math.random() * 100);
prosa("Número da sorte: " mais numero_sorte);

prosa("🎉 Projeto criado com sucesso!");