// RPG Demo - Demonstração de conceitos básicos de RPG em GoiásScript
// Autor: Gefferson
// Data: 13/04/2025

// ==================== FUNÇÕES UTILITÁRIAS ====================

// Função para mostrar uma linha separadora
presta_serviço linha_separadora() {
    prosa("----------------------------------------");
}

// Função para mostrar texto de título
presta_serviço mostrar_titulo(titulo) {
    linha_separadora();
    prosa(titulo);
    linha_separadora();
}

// ==================== FUNÇÕES DE DEMONSTRAÇÃO ====================

// Função para mostrar uma descrição de local
presta_serviço descrever_vila() {
    prosa("Você está na Vila dos Aventureiros.");
    prosa("Um lugar pacífico com lojas, taverna e muitos aventureiros.");
    prosa("Daqui você pode explorar as terras de Goiás.");
}

// Função para descrever a floresta
presta_serviço descrever_floresta() {
    prosa("Você está na Floresta Sombria.");
    prosa("Uma floresta densa com árvores altas e muitos perigos.");
    prosa("Cuidado com os monstros que habitam este lugar!");
}

// Função para mostrar as opções de menu
presta_serviço mostrar_menu() {
    prosa("O que você deseja fazer?");
    prosa("1. Explorar a Vila");
    prosa("2. Aventurar-se na Floresta");
    prosa("3. Ver status do herói");
    prosa("4. Encerrar aventura");
}

// Função para mostrar status do herói
presta_serviço mostrar_status_heroi(nome, classe, nivel, vida) {
    mostrar_titulo("STATUS DO HERÓI");
    prosa("Nome: " mais nome);
    prosa("Classe: " mais classe);
    prosa("Nível: " mais nivel);
    prosa("Pontos de vida: " mais vida);
}

// Função para simular uma batalha simples
presta_serviço simular_batalha() {
    mostrar_titulo("BATALHA");
    prosa("Você encontrou um Goblin!");
    prosa("Você ataca com sua espada...");
    prosa("O Goblin é derrotado!");
    prosa("Você ganhou 10 pontos de experiência e 5 moedas de ouro.");
}

// ==================== FUNÇÃO PRINCIPAL ====================

// Introdução ao jogo
mostrar_titulo("RPG AVENTURA - GOIÁS QUEST");
prosa("Bem-vindo ao mundo de Goiás Quest!");
prosa("Uma terra mágica cheia de aventuras e perigos.");
prosa("Você é um aventureiro em busca de fama e fortuna.");

linha_separadora();

// Definição do herói (valores fixos para demonstração)
uai heroi_nome é "Araújo";
uai heroi_classe é "Guerreiro";
uai heroi_nivel é "1";
uai heroi_vida é "100";

// Mostrar status inicial do herói
mostrar_status_heroi(heroi_nome, heroi_classe, heroi_nivel, heroi_vida);

// Simulação de jogo
mostrar_titulo("INÍCIO DA AVENTURA");
prosa("Você acorda na vila dos aventureiros...");
prosa("Um novo dia de aventuras o aguarda!");

linha_separadora();
descrever_vila();
linha_separadora();

prosa("\nVocê decide explorar os arredores...");
descrever_floresta();

linha_separadora();
prosa("\nSúbito, você ouve um barulho nos arbustos!");
simular_batalha();

// Conclusão
mostrar_titulo("FIM DA DEMONSTRAÇÃO");
prosa("Esta foi apenas uma pequena demonstração das funcionalidades do jogo.");
prosa("Em uma versão completa, você poderia:");
prosa("- Explorar diferentes locais");
prosa("- Lutar contra diversos monstros");
prosa("- Evoluir seu personagem");
prosa("- Coletar itens e equipamentos");
prosa("- Completar missões e desafios");

mostrar_titulo("OBRIGADO POR JOGAR!");
prosa("Desenvolvido com GoiásScript");