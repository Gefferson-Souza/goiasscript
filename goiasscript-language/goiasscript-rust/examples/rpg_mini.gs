// RPG MINI - Versão simplificada para testar o suporte à entrada do usuário
// Autor: Gefferson
// Data: 13/04/2025

// Variáveis do jogador
trem jogador_nome é "Aventureiro";
trem jogador_vida é 100;
trem jogador_ataque é 15;
trem jogador_ouro é 20;

// Variáveis do jogo
trem jogando é certeza;

// Funções básicas
presta_serviço linha() {
    prosa("----------------------------------------");
}

presta_serviço pausar() {
    prosa("Pressione ENTER para continuar...");
    uai _ é ler_escolha();
}

// Função para mostrar o status do jogador
presta_serviço mostrar_status() {
    linha();
    prosa("===== STATUS DO AVENTUREIRO =====");
    prosa("Nome: " mais jogador_nome);
    prosa("Vida: " mais jogador_vida);
    prosa("Ataque: " mais jogador_ataque);
    prosa("Ouro: " mais jogador_ouro);
    linha();
    pausar();
}

// Função para simular uma batalha simples
presta_serviço batalhar() {
    linha();
    prosa("===== BATALHA! =====");
    
    uai inimigo_nome é "Lobo";
    trem inimigo_vida é 20;
    trem inimigo_ataque é 5;
    
    prosa("Um " mais inimigo_nome mais " apareceu!");
    prosa("Vida do inimigo: " mais inimigo_vida);
    
    // Simular um ataque
    prosa("Você ataca o " mais inimigo_nome mais "!");
    trem dano é jogador_ataque menos 5;
    inimigo_vida é inimigo_vida menos dano;
    
    prosa("Você causou " mais dano mais " de dano!");
    
    se_ocê_quiser(inimigo_vida menor_que 1) {
        prosa("Você derrotou o " mais inimigo_nome mais "!");
        jogador_ouro é jogador_ouro mais 10;
        prosa("Você ganhou 10 de ouro!");
    } se_não {
        prosa("O " mais inimigo_nome mais " contra-atacou!");
        jogador_vida é jogador_vida menos inimigo_ataque;
        prosa("Você perdeu " mais inimigo_ataque mais " de vida!");
    }
    
    linha();
    pausar();
}

// Função para visitar a loja
presta_serviço visitar_loja() {
    linha();
    prosa("===== LOJA =====");
    prosa("Bem-vindo à loja! Você tem " mais jogador_ouro mais " de ouro.");
    prosa("1. Comprar poção (10 ouro)");
    prosa("2. Sair da loja");
    
    prosa("O que deseja fazer?");
    uai escolha é ler_escolha();
    
    se_ocê_quiser(escolha é_igualim "1") {
        se_ocê_quiser(jogador_ouro pelo_menos 10) {
            jogador_ouro é jogador_ouro menos 10;
            jogador_vida é jogador_vida mais 20;
            prosa("Você comprou uma poção e recuperou 20 de vida!");
            prosa("Sua vida atual: " mais jogador_vida);
        } se_não {
            prosa("Você não tem ouro suficiente!");
        }
    }
    
    linha();
    pausar();
}

// Menu principal
linha();
prosa("===== RPG MINI =====");
prosa("Bem-vindo ao RPG MINI!");
linha();

// Solicitar nome do jogador
prosa("Qual é o seu nome, aventureiro?");
jogador_nome é ler_escolha();

prosa("Bem-vindo, " mais jogador_nome mais "!");
pausar();

// Loop principal
enquanto_tiver(jogando) {
    linha();
    prosa("===== MENU PRINCIPAL =====");
    prosa("1. Batalhar");
    prosa("2. Visitar a loja");
    prosa("3. Ver status");
    prosa("4. Sair do jogo");
    linha();
    
    prosa("O que deseja fazer?");
    uai escolha é ler_escolha();
    
    se_ocê_quiser(escolha é_igualim "1") {
        batalhar();
    } se_não {
        se_ocê_quiser(escolha é_igualim "2") {
            visitar_loja();
        } se_não {
            se_ocê_quiser(escolha é_igualim "3") {
                mostrar_status();
            } se_não {
                se_ocê_quiser(escolha é_igualim "4") {
                    jogando é de_jeito_nenhum;
                }
            }
        }
    }
}

// Fim do jogo
linha();
prosa("===== FIM DO JOGO =====");
prosa("Obrigado por jogar RPG MINI!");
prosa("Estatísticas finais:");
prosa("Nome: " mais jogador_nome);
prosa("Ouro acumulado: " mais jogador_ouro);
linha();