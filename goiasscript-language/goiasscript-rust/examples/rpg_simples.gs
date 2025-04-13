// RPG Aventura Simples - Um jogo RPG textual básico em GoiásScript
// Autor: Gefferson
// Data: 13/04/2025

// ==================== FUNÇÕES UTILITÁRIAS ====================

// Função para mostrar uma linha separadora
presta_serviço linha_separadora() {
    prosa("----------------------------------------");
}

// Função para pausar o jogo (simulado)
presta_serviço pausar() {
    prosa("Pressione ENTER para continuar...");
}

// ==================== FUNÇÕES DO JOGO ====================

// Função que gera o nome de um inimigo (simplificado)
presta_serviço gerar_inimigo_nome() {
    faz_favor "Goblin";
}

// Função que gera a força de um inimigo (simplificado)
presta_serviço gerar_inimigo_forca() {
    faz_favor 5;
}

// Função que retorna o valor de uma recompensa (simplificado)
presta_serviço gerar_recompensa() {
    faz_favor 10;
}

// Função para mostrar o status inicial de um herói
presta_serviço mostrar_heroi(nome, nivel, vida, ataque, defesa, ouro) {
    prosa("===== STATUS DO HERÓI =====");
    prosa("Nome: " mais nome);
    prosa("Nível: " mais nivel);
    prosa("Vida: " mais vida);
    prosa("Ataque: " mais ataque);
    prosa("Defesa: " mais defesa);
    prosa("Ouro: " mais ouro);
    linha_separadora();
}

// Função para simular uma batalha
presta_serviço simular_batalha(heroi_nome, heroi_ataque, inimigo_nome, inimigo_forca) {
    prosa("=== BATALHA INICIADA! ===");
    prosa(heroi_nome mais " encontrou um " mais inimigo_nome mais "!");
    
    // Simular ataque do herói
    prosa(heroi_nome mais " ataca com força " mais heroi_ataque);
    
    // Simular resultado simples
    se_ocê_quiser(heroi_ataque maior_que inimigo_forca) {
        prosa("Você derrotou o " mais inimigo_nome mais "!");
        prosa("Você ganhou experiência e ouro!");
        faz_favor certeza;  // Vitória
    } se_não {
        prosa("O " mais inimigo_nome mais " é muito forte!");
        prosa("Você perdeu a batalha.");
        faz_favor de_jeito_nenhum;  // Derrota
    }
}

// Função que simula a compra de um item na loja
presta_serviço comprar_item(item_nome, item_preco, ouro_atual) {
    prosa("Tentando comprar: " mais item_nome);
    prosa("Preço: " mais item_preco mais " ouro");
    
    se_ocê_quiser(ouro_atual pelo_menos item_preco) {
        prosa("Compra realizada com sucesso!");
        faz_favor ouro_atual menos item_preco;  // Retornar novo valor do ouro
    } se_não {
        prosa("Ouro insuficiente para comprar este item!");
        faz_favor ouro_atual;  // Ouro permanece o mesmo
    }
}

// Função que mostra a descrição de uma localização
presta_serviço descrever_local(nome_local) {
    linha_separadora();
    prosa("Você está em: " mais nome_local);
    
    se_ocê_quiser(nome_local é_igualim "Vila") {
        prosa("Uma vila pacífica com uma loja de itens e curandeiros.");
        prosa("O que você deseja fazer?");
        prosa("1. Visitar a loja");
        prosa("2. Visitar o curandeiro");
        prosa("3. Sair para a floresta");
        prosa("4. Ver status");
        prosa("9. Sair do jogo");
    } se_não {
        se_ocê_quiser(nome_local é_igualim "Floresta") {
            prosa("Uma floresta densa e perigosa cheia de inimigos.");
            prosa("O que você deseja fazer?");
            prosa("1. Procurar inimigos");
            prosa("2. Voltar para a vila");
            prosa("9. Sair do jogo");
        } se_não {
            se_ocê_quiser(nome_local é_igualim "Loja") {
                prosa("Uma loja com itens diversos.");
                prosa("O que você deseja fazer?");
                prosa("1. Comprar poção (20 ouro)");
                prosa("2. Comprar arma melhor (50 ouro)");
                prosa("3. Voltar para a vila");
                prosa("9. Sair do jogo");
            } se_não {
                se_ocê_quiser(nome_local é_igualim "Curandeiro") {
                    prosa("O curandeiro pode restaurar sua vida por 10 de ouro.");
                    prosa("O que você deseja fazer?");
                    prosa("1. Curar-se completamente (10 ouro)");
                    prosa("2. Voltar para a vila");
                    prosa("9. Sair do jogo");
                } se_não {
                    prosa("Local desconhecido!");
                }
            }
        }
    }
    
    linha_separadora();
}

// Função que retorna mensagem de uma aventura
presta_serviço aventura_floresta() {
    uai mensagens é "Você caminha pela floresta densa...";
    
    faz_favor mensagens;
}

// ==================== FUNÇÃO PRINCIPAL ====================

// Definir características do herói
uai heroi_nome é "Aventureiro";
trem heroi_vida é 100;
trem heroi_ataque é 15;
trem heroi_defesa é 10;
trem heroi_nivel é 1;
trem heroi_ouro é 50;

// Introdução do jogo
prosa("=== RPG AVENTURA - GOIÁS QUEST ===");
prosa("Bem-vindo ao mundo de Goiás Quest!");
prosa("Você é um aventureiro em busca de fama e fortuna.");
linha_separadora();

// Mostrar status inicial do herói
mostrar_heroi(heroi_nome, heroi_nivel, heroi_vida, heroi_ataque, heroi_defesa, heroi_ouro);
pausar();

// Simulação de jogo - demonstrando funcionalidades básicas
prosa("\n=== DEMONSTRAÇÃO DO JOGO ===");

// Demonstração 1: Visitar localidades
descrever_local("Vila");
pausar();
descrever_local("Floresta");
pausar();
descrever_local("Loja");
pausar();

// Demonstração 2: Batalhar
prosa("\n=== DEMONSTRANDO BATALHA ===");
uai inimigo_nome é gerar_inimigo_nome();
trem inimigo_forca é gerar_inimigo_forca();
uai resultado_batalha é simular_batalha(heroi_nome, heroi_ataque, inimigo_nome, inimigo_forca);

se_ocê_quiser(resultado_batalha) {
    prosa("Parabéns pela vitória!");
    heroi_ouro é heroi_ouro mais gerar_recompensa();
    prosa("Seu ouro atual: " mais heroi_ouro);
} se_não {
    prosa("Mais sorte na próxima vez!");
}
pausar();

// Demonstração 3: Comprar itens
prosa("\n=== DEMONSTRANDO COMPRAS ===");
uai item_nome é "Poção de Cura";
trem item_preco é 20;
heroi_ouro é comprar_item(item_nome, item_preco, heroi_ouro);
prosa("Ouro restante: " mais heroi_ouro);

uai item_nome2 é "Espada Mágica";
trem item_preco2 é 100;
heroi_ouro é comprar_item(item_nome2, item_preco2, heroi_ouro);
prosa("Ouro restante: " mais heroi_ouro);

// Finalização do jogo de demonstração
prosa("\n=== FIM DA DEMONSTRAÇÃO ===");
prosa("Estatísticas finais:");
mostrar_heroi(heroi_nome, heroi_nivel, heroi_vida, heroi_ataque, heroi_defesa, heroi_ouro);
prosa("Obrigado por jogar RPG Aventura - Goiás Quest!");
linha_separadora();