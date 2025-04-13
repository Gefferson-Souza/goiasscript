// JOGO ULTRA SIMPLES - Demonstração básica de entrada do usuário
// Autor: Gefferson
// Data: 13/04/2025

// Introdução
prosa("============================================");
prosa("        AVENTURA GOIANA SIMPLES            ");
prosa("============================================");
prosa("Um jogo de texto ultra simples para testar");
prosa("a entrada do usuário em GoiásScript.");
prosa("============================================");
prosa("");

// Solicitar nome
prosa("Como você se chama, aventureiro?");
trem nome é ler_escolha();
prosa("Olá, " mais nome mais "! Bem-vindo à sua aventura!");
prosa("");

// História simples
prosa("Você está em uma encruzilhada na estrada.");
prosa("Para qual direção deseja seguir?");
prosa("1 - Esquerda (para a floresta)");
prosa("2 - Direita (para a montanha)");

trem escolha é ler_escolha();

se_ocê_quiser (escolha é_igualim "1") {
    prosa("Você escolheu seguir para a floresta.");
    prosa("Os sons da natureza envolvem você enquanto caminha");
    prosa("por entre árvores altas e vegetação exuberante.");
    prosa("");
    prosa("De repente, você encontra um tesouro escondido!");
    prosa("Você ganhou 50 moedas de ouro!");
} se_não {
    prosa("Você escolheu seguir para a montanha.");
    prosa("O caminho é íngreme e rochoso, mas a vista é deslumbrante.");
    prosa("Ao chegar no topo, você avista um dragão dormindo!");
    prosa("");
    prosa("O que você faz?");
    prosa("1 - Tentar passar despercebido");
    prosa("2 - Enfrentar o dragão");
    
    trem escolha_dragao é ler_escolha();
    
    se_ocê_quiser (escolha_dragao é_igualim "1") {
        prosa("Você consegue passar despercebido e encontra");
        prosa("uma passagem secreta com um tesouro!");
        prosa("Você ganhou 100 moedas de ouro!");
    } se_não {
        prosa("Você tenta enfrentar o dragão, mas ele é muito forte!");
        prosa("Por sorte, você consegue fugir com apenas alguns arranhões.");
        prosa("Você ganhou 20 moedas de ouro e uma história para contar!");
    }
}

// Final
prosa("");
prosa("============================================");
prosa("Obrigado por jogar, " mais nome mais "!");
prosa("Essa foi apenas uma pequena demonstração.");
prosa("Em breve teremos um jogo completo!");
prosa("============================================");