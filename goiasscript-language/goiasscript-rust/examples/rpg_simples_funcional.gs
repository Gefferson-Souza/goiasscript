// RPG Ultra Simples - Jogo que funciona com as limitações atuais do GoiásScript
// Autor: Gefferson
// Data: 13/04/2025

// Introdução
prosa("============================================");
prosa("        MINI AVENTURA EM GOIÁS             ");
prosa("============================================");
prosa("Bem-vindo à mini aventura em GoiásScript!");
prosa("Uma jornada textual simples com algumas escolhas.");
prosa("============================================");
prosa("");

// Solicitar nome do jogador
prosa("Como você se chama, aventureiro?");
trem nome é ler_escolha();

prosa("Bem-vindo, " mais nome mais "! Sua aventura começa agora!");
prosa("");
prosa("Pressione ENTER para continuar...");
trem _ é ler_escolha();

// Início da aventura
prosa("============================================");
prosa("Você acorda em uma pequena vila. O sol brilha e");
prosa("os pássaros cantam. Você se sente disposto a");
prosa("iniciar sua jornada como aventureiro.");
prosa("");
prosa("Você tem 50 moedas de ouro e uma espada básica.");
prosa("");
prosa("O que você deseja fazer?");
prosa("1 - Visitar a loja de armas");
prosa("2 - Explorar a floresta próxima");
trem escolha1 é ler_escolha();

// Primeira escolha
se_ocê_quiser (escolha1 é_igualim "1") {
    prosa("Você caminha até a loja de armas da vila.");
    prosa("O ferreiro te cumprimenta:");
    prosa("'Olá " mais nome mais "! O que procura hoje?'");
    prosa("");
    prosa("1 - Comprar espada melhor (40 moedas)");
    prosa("2 - Apenas olhar e sair");
    trem escolha_loja é ler_escolha();
    
    se_ocê_quiser (escolha_loja é_igualim "1") {
        prosa("Você compra uma espada de aço brilhante!");
        prosa("Sua força de ataque aumentou!");
        prosa("Restam 10 moedas de ouro.");
        prosa("");
        prosa("Agora você decide explorar a floresta com sua nova arma.");
    } se_não {
        prosa("Você decide não comprar nada e sair da loja.");
        prosa("Você ainda tem 50 moedas de ouro.");
        prosa("");
        prosa("Você decide explorar a floresta com sua espada básica.");
    }
} se_não {
    prosa("Você decide ir direto para a floresta com sua espada básica.");
    prosa("Você ainda tem todas as suas 50 moedas de ouro.");
}

prosa("Pressione ENTER para continuar...");
trem _ é ler_escolha();

// Aventura na floresta
prosa("============================================");
prosa("Você adentra a Floresta Sombria...");
prosa("As árvores são altas e bloqueiam grande parte da luz solar.");
prosa("De repente, você ouve um barulho nos arbustos próximos!");
prosa("");
prosa("É um Goblin! Ele parece hostil e avança em sua direção!");
prosa("");
prosa("O que você faz?");
prosa("1 - Lutar contra o Goblin");
prosa("2 - Tentar fugir");
trem escolha_floresta é ler_escolha();

// Segunda escolha
se_ocê_quiser (escolha_floresta é_igualim "1") {
    prosa("Você empunha sua espada e enfrenta o Goblin!");
    
    se_ocê_quiser (escolha1 é_igualim "1" e_mais escolha_loja é_igualim "1") {
        prosa("Com sua nova espada de aço, você rapidamente derrota o Goblin!");
        prosa("Você encontrou 30 moedas de ouro e uma poção de cura!");
        prosa("Agora você tem 40 moedas no total.");
    } se_não {
        prosa("Com sua espada básica, você luta bravamente.");
        prosa("Após um combate difícil, você consegue derrotar o Goblin!");
        prosa("Você sofreu alguns ferimentos, mas encontrou 30 moedas de ouro!");
        prosa("Agora você tem 80 moedas no total.");
    }
} se_não {
    prosa("Você tenta escapar do Goblin...");
    prosa("Você corre rapidamente entre as árvores!");
    prosa("Por sorte, consegue despistar o monstro, mas deixa cair 10 moedas.");
    
    se_ocê_quiser (escolha1 é_igualim "1" e_mais escolha_loja é_igualim "1") {
        prosa("Agora você tem apenas 0 moedas.");
    } se_não {
        prosa("Agora você tem 40 moedas.");
    }
}

prosa("Pressione ENTER para continuar...");
trem _ é ler_escolha();

// Final da aventura
prosa("============================================");
prosa("Após sua aventura na floresta, você retorna à vila.");
prosa("As pessoas te recebem como um herói quando ouvem sobre");
prosa("sua encontro com o Goblin na floresta.");
prosa("");
prosa("Parabéns, " mais nome mais "!");
prosa("Você completou com sucesso sua primeira aventura!");
prosa("");

se_ocê_quiser (escolha_floresta é_igualim "1") {
    prosa("Por derrotar o Goblin, você ganhou respeito na vila");
    prosa("e agora é conhecido como um bravo guerreiro!");
} se_não {
    prosa("Embora tenha fugido desta vez, você ganhou conhecimento");
    prosa("sobre os perigos da floresta e estará mais preparado na próxima!");
}

prosa("");
prosa("============================================");
prosa("             FIM DA AVENTURA               ");
prosa("============================================");
prosa("Obrigado por jogar esta mini aventura em GoiásScript!");
prosa("Aguarde por versões futuras com mais conteúdo!");

// Final
prosa("");
prosa("Pressione ENTER para sair...");
trem _ é ler_escolha();