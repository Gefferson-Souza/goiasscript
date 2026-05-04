// Testes básicos para {{projeto_nome}}

prosa("=== Executando Testes ===");

// Teste 1: Verificar se variáveis funcionam
prosa("Teste 1: Variáveis básicas");
uai nome_teste é "GoiásScript";
trem resultado_teste = (nome_teste é_igual_a "GoiásScript");

se (resultado_teste) {
  prosa("✅ Teste 1 passou!");
} senao {
  prosa("❌ Teste 1 falhou!");
}

// Teste 2: Verificar se funções funcionam
prosa("Teste 2: Funções básicas");
presta_serviço testaFuncao(valor) {
  faz_favor valor mais " - testado!";
}

uai resultado_funcao = testaFuncao("GoiásScript");
trem teste_funcao_ok = (resultado_funcao é_igual_a "GoiásScript - testado!");

se (teste_funcao_ok) {
  prosa("✅ Teste 2 passou!");
} senao {
  prosa("❌ Teste 2 falhou!");
}

// Teste 3: Verificar arrays
prosa("Teste 3: Arrays (listas)");
uai lista_teste é ["item1", "item2", "item3"];
trem tamanho_correto = (lista_teste.tamanho() é_igual_a 3);

se (tamanho_correto) {
  prosa("✅ Teste 3 passou!");
} senao {
  prosa("❌ Teste 3 falhou!");
}

prosa("=== Testes Concluídos ===");

// Contador de testes que passaram
uai testes_passaram = 0;
se (resultado_teste) { testes_passaram = testes_passaram mais 1; }
se (teste_funcao_ok) { testes_passaram = testes_passaram mais 1; }  
se (tamanho_correto) { testes_passaram = testes_passaram mais 1; }

prosa("Resultados: " mais testes_passaram mais "/3 testes passaram");

se (testes_passaram é_igual_a 3) {
  prosa("🎉 Todos os testes passaram! Projeto funcionando corretamente.");
} senao {
  prosa("⚠️ Alguns testes falharam. Verifique o código.");
}