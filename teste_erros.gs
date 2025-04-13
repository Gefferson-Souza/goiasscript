// Teste de erros personalizados em GoiásScript
prosa("=== Testando erros personalizados em GoiásScript ===");

// Menu para testar cada tipo de erro
prosa("\n=== Menu de Testes de Erro ===");
prosa("Descomente apenas um teste por vez para ver o erro correspondente:");

// === 1. Erro personalizado com vixe_que ===
// prosa("\n1. Testando 'vixe_que' para criar erro personalizado:");
// vixe_que("Queijo acabou!", "tipo", "Compra mais queijo no mercadinho.");

// === 2. Erro de referência (variável não definida) ===
prosa("\n2. Testando erro de referência (variável não definida):");
prosa("O valor é: " + valorQueNaoExiste);

// === 3. Erro de tipo (chamar algo que não é função) ===
// prosa("\n3. Testando erro de tipo (chamar algo que não é função):");
// uai coisa é "texto";
// coisa(); 

// === 4. Erro de divisão por zero ===
// prosa("\n4. Testando erro de divisão por zero:");
// uai resultado é 10 dividido 0;
// prosa("O resultado é: " + resultado);

// === 5. Erro de nullish (tentar acessar propriedade de null) ===
// prosa("\n5. Testando erro ao acessar propriedade de null:");
// uai objeto é vazio;
// prosa("A propriedade é: " + objeto.propriedade);

// === 6. Erro em promessa rejeitada ===
// vai_na_frente_presta_serviço testeErroPromessa() {
//   prosa("\n6. Testando erro em promessa rejeitada:");
//   uai minhaPromessa é faz_um promessa((resolve_aí, rejeita_isso) => {
//     rejeita_isso("Deu pobrema demais da conta!");
//   });
//   espera_um_cadim minhaPromessa;
// }
// testeErroPromessa();

// === 7. Erro de recursão infinita ===
// presta_serviço chamaInfinito() {
//   prosa("Recursão sem fim...");
//   chamaInfinito();
// }
// prosa("\n7. Testando erro de recursão infinita:");
// chamaInfinito();

prosa("\nDescomente uma das seções de teste acima para ver os erros personalizados em ação!");