// teste-gs-bench - GoiásScript v2.0
// Arquivo principal do projeto

prosa("=== Projeto teste-gs-bench ===");

trem mensagem é "Oi sô! Seu projeto GoiásScript tá funcionando!";
prosa(mensagem);

trem nome_projeto é "teste-gs-bench";
prosa("Nome do projeto: " mais nome_projeto);

trem tecnologias é ["GoiásScript", "JavaScript", "Node.js"];
prosa("Tecnologias usadas:");

vai_indo (trem i é 0; i menor_que tecnologias.tamanho(); i = i mais 1) {
  prosa("• " mais tecnologias[i]);
}

trem numero_sorte = Math.floor(Math.random() * 100);
prosa("Número da sorte: " mais numero_sorte);

prosa("🎉 Projeto criado com sucesso!");
prosa("💡 Use: goiasscript vê_se_tá_certo para verificar tipos");
prosa("💡 Use: goiasscript traduz para gerar JavaScript");