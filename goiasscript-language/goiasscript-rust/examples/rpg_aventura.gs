// RPG Aventura - Um jogo simples de RPG textual em GoiásScript
// Autor: Gefferson
// Data: 13/04/2025

// ==================== VARIÁVEIS GLOBAIS ====================
// Atributos do herói
trem heroi_nome é "Aventureiro";
trem heroi_vida é 100;
trem heroi_ataque é 15;
trem heroi_defesa é 10;
trem heroi_nivel é 1;
trem heroi_experiencia é 0;
trem heroi_experiencia_proxnivel é 100;
trem heroi_ouro é 50;
trem heroi_pocoes é 3;

// Estado atual do jogo
trem local_atual é "Vila";
trem inimigo_derrotados é 0;
trem jogando é certeza;

// ==================== FUNÇÕES UTILITÁRIAS ====================

// Função para mostrar uma linha separadora
presta_serviço linha_separadora() {
    prosa("----------------------------------------");
}

// Função para solicitar entrada do usuário
presta_serviço solicitar_opcao() {
    prosa("Digite sua escolha: ");
    faz_favor "1";  // Simulação de entrada do usuário
}

// Função para limpar a tela (simulado)
presta_serviço limpar_tela() {
    prosa("\n\n\n\n\n");
    linha_separadora();
}

// Função para pausar (simulado)
presta_serviço pausar() {
    prosa("Pressione ENTER para continuar...");
}

// ==================== FUNÇÕES DO JOGO ====================

// Mostrar status do jogador
presta_serviço mostrar_status() {
    limpar_tela();
    prosa("===== STATUS DO HERÓI =====");
    prosa("Nome: " mais heroi_nome);
    prosa("Nível: " mais heroi_nivel);
    prosa("Vida: " mais heroi_vida);
    prosa("Ataque: " mais heroi_ataque);
    prosa("Defesa: " mais heroi_defesa);
    prosa("Experiência: " mais heroi_experiencia mais "/" mais heroi_experiencia_proxnivel);
    prosa("Ouro: " mais heroi_ouro);
    prosa("Poções: " mais heroi_pocoes);
    linha_separadora();
    pausar();
}

// Mostrar localização atual
presta_serviço mostrar_local() {
    limpar_tela();
    linha_separadora();
    prosa("Você está em: " mais local_atual);
    
    se_ocê_quiser(local_atual é_igualim "Vila") {
        prosa("Uma vila pacífica com uma loja de itens e curandeiros.");
        prosa("O que você deseja fazer?");
        prosa("1. Visitar a loja");
        prosa("2. Visitar o curandeiro");
        prosa("3. Sair para a floresta");
        prosa("4. Ver status");
        prosa("9. Sair do jogo");
    } se_não {
        se_ocê_quiser(local_atual é_igualim "Floresta") {
            prosa("Uma floresta densa e perigosa cheia de inimigos.");
            prosa("O que você deseja fazer?");
            prosa("1. Procurar inimigos");
            prosa("2. Voltar para a vila");
            prosa("3. Usar poção (restaura 30 de vida)");
            prosa("4. Ver status");
            prosa("9. Sair do jogo");
        } se_não {
            se_ocê_quiser(local_atual é_igualim "Loja") {
                prosa("Uma loja com itens diversos. Você tem " mais heroi_ouro mais " de ouro.");
                prosa("O que você deseja fazer?");
                prosa("1. Comprar poção (20 ouro)");
                prosa("2. Melhorar arma (50 ouro, +5 ataque)");
                prosa("3. Melhorar armadura (50 ouro, +5 defesa)");
                prosa("4. Voltar para a vila");
                prosa("9. Sair do jogo");
            } se_não {
                se_ocê_quiser(local_atual é_igualim "Curandeiro") {
                    prosa("O curandeiro pode restaurar sua vida por 10 de ouro.");
                    prosa("O que você deseja fazer?");
                    prosa("1. Curar-se completamente (10 ouro)");
                    prosa("2. Voltar para a vila");
                    prosa("9. Sair do jogo");
                } se_não {
                    prosa("Local desconhecido! Voltando para a vila...");
                    local_atual é "Vila";
                }
            }
        }
    }
    
    linha_separadora();
}

// Função para usar poção
presta_serviço usar_pocao() {
    se_ocê_quiser(heroi_pocoes maior_que 0) {
        heroi_pocoes é heroi_pocoes menos 1;
        heroi_vida é heroi_vida mais 30;
        
        // Limitar vida máxima a 100
        se_ocê_quiser(heroi_vida maior_que 100) {
            heroi_vida é 100;
        }
        
        prosa("Você usou uma poção! Sua vida atual é: " mais heroi_vida);
    } se_não {
        prosa("Você não tem poções!");
    }
    pausar();
}

// Função para processar nível
presta_serviço verificar_nivel() {
    se_ocê_quiser(heroi_experiencia pelo_menos heroi_experiencia_proxnivel) {
        heroi_nivel é heroi_nivel mais 1;
        heroi_ataque é heroi_ataque mais 3;
        heroi_defesa é heroi_defesa mais 2;
        heroi_vida é 100;
        heroi_experiencia é heroi_experiencia menos heroi_experiencia_proxnivel;
        heroi_experiencia_proxnivel é heroi_experiencia_proxnivel mais heroi_experiencia_proxnivel dividido 2;
        
        limpar_tela();
        prosa("=== PARABÉNS! VOCÊ SUBIU DE NÍVEL! ===");
        prosa("Novo nível: " mais heroi_nivel);
        prosa("Ataque aumentou para: " mais heroi_ataque);
        prosa("Defesa aumentou para: " mais heroi_defesa);
        prosa("Sua vida foi restaurada!");
        linha_separadora();
        pausar();
    }
}

// Gerar um inimigo aleatório (simulado)
presta_serviço gerar_inimigo() {
    trem inimigo_nome é "Goblin";
    trem inimigo_vida é 50 mais heroi_nivel vezes 5;
    trem inimigo_ataque é 8 mais heroi_nivel vezes 2;
    trem inimigo_defesa é 5 mais heroi_nivel;
    trem inimigo_ouro é 10 mais heroi_nivel vezes 3;
    trem inimigo_exp é 30 mais heroi_nivel vezes 10;
    
    faz_favor inimigo_nome;
}

// Batalhar contra um inimigo
presta_serviço batalhar() {
    uai inimigo_nome é gerar_inimigo();
    trem inimigo_vida é 50 mais heroi_nivel vezes 5;
    trem inimigo_ataque é 8 mais heroi_nivel vezes 2;
    trem inimigo_defesa é 5 mais heroi_nivel;
    trem inimigo_ouro é 10 mais heroi_nivel vezes 3;
    trem inimigo_exp é 30 mais heroi_nivel vezes 10;
    
    limpar_tela();
    prosa("=== BATALHA INICIADA! ===");
    prosa("Um " mais inimigo_nome mais " apareceu!");
    prosa("Vida do inimigo: " mais inimigo_vida);
    linha_separadora();
    
    // Loop de batalha
    trem turno é 1;
    enquanto_tiver(inimigo_vida maior_que 0 e_mais heroi_vida maior_que 0) {
        prosa("-- Turno " mais turno mais " --");
        
        // Ataque do herói
        trem dano_ao_inimigo é heroi_ataque menos inimigo_defesa dividido 2;
        se_ocê_quiser(dano_ao_inimigo menor_que 1) {
            dano_ao_inimigo é 1;
        }
        
        inimigo_vida é inimigo_vida menos dano_ao_inimigo;
        prosa("Você atacou o " mais inimigo_nome mais " causando " mais dano_ao_inimigo mais " de dano!");
        
        // Verificar se o inimigo foi derrotado
        se_ocê_quiser(inimigo_vida pelo_menos 1) {
            // Ataque do inimigo
            trem dano_ao_heroi é inimigo_ataque menos heroi_defesa dividido 2;
            se_ocê_quiser(dano_ao_heroi menor_que 1) {
                dano_ao_heroi é 1;
            }
            
            heroi_vida é heroi_vida menos dano_ao_heroi;
            prosa(inimigo_nome mais " atacou você causando " mais dano_ao_heroi mais " de dano!");
            prosa("Sua vida: " mais heroi_vida mais " | Vida do inimigo: " mais inimigo_vida);
        } se_não {
            inimigo_vida é 0;
            prosa("O " mais inimigo_nome mais " foi derrotado!");
        }
        
        turno é turno mais 1;
        pausar();
    }
    
    // Verificar resultado da batalha
    se_ocê_quiser(inimigo_vida pelo_menos 1) {
        // Herói morreu
        limpar_tela();
        prosa("=== VOCÊ FOI DERROTADO! ===");
        prosa("O jogo terminou!");
        jogando é de_jeito_nenhum;
    } se_não {
        // Inimigo derrotado
        limpar_tela();
        prosa("=== VITÓRIA! ===");
        prosa("Você derrotou o " mais inimigo_nome mais "!");
        prosa("Ganhou " mais inimigo_ouro mais " de ouro!");
        prosa("Ganhou " mais inimigo_exp mais " de experiência!");
        
        // Recompensas
        heroi_ouro é heroi_ouro mais inimigo_ouro;
        heroi_experiencia é heroi_experiencia mais inimigo_exp;
        inimigo_derrotados é inimigo_derrotados mais 1;
        
        linha_separadora();
        pausar();
        
        // Verificar se subiu de nível
        verificar_nivel();
    }
}

// Função para processar a visita à loja
presta_serviço processar_loja(escolha) {
    se_ocê_quiser(escolha é_igualim "1") {
        // Comprar poção
        se_ocê_quiser(heroi_ouro pelo_menos 20) {
            heroi_ouro é heroi_ouro menos 20;
            heroi_pocoes é heroi_pocoes mais 1;
            prosa("Você comprou uma poção! Agora tem " mais heroi_pocoes mais " poções.");
        } se_não {
            prosa("Ouro insuficiente para comprar poção!");
        }
        pausar();
    } se_não {
        se_ocê_quiser(escolha é_igualim "2") {
            // Melhorar arma
            se_ocê_quiser(heroi_ouro pelo_menos 50) {
                heroi_ouro é heroi_ouro menos 50;
                heroi_ataque é heroi_ataque mais 5;
                prosa("Você melhorou sua arma! Seu ataque agora é " mais heroi_ataque);
            } se_não {
                prosa("Ouro insuficiente para melhorar arma!");
            }
            pausar();
        } se_não {
            se_ocê_quiser(escolha é_igualim "3") {
                // Melhorar armadura
                se_ocê_quiser(heroi_ouro pelo_menos 50) {
                    heroi_ouro é heroi_ouro menos 50;
                    heroi_defesa é heroi_defesa mais 5;
                    prosa("Você melhorou sua armadura! Sua defesa agora é " mais heroi_defesa);
                } se_não {
                    prosa("Ouro insuficiente para melhorar armadura!");
                }
                pausar();
            } se_não {
                se_ocê_quiser(escolha é_igualim "4") {
                    local_atual é "Vila";
                }
            }
        }
    }
}

// Função para processar a visita ao curandeiro
presta_serviço processar_curandeiro(escolha) {
    se_ocê_quiser(escolha é_igualim "1") {
        se_ocê_quiser(heroi_ouro pelo_menos 10) {
            heroi_ouro é heroi_ouro menos 10;
            heroi_vida é 100;
            prosa("Você foi curado completamente! Sua vida agora é 100.");
        } se_não {
            prosa("Ouro insuficiente para se curar!");
        }
        pausar();
    } se_não {
        se_ocê_quiser(escolha é_igualim "2") {
            local_atual é "Vila";
        }
    }
}

// Função para processar ações na floresta
presta_serviço processar_floresta(escolha) {
    se_ocê_quiser(escolha é_igualim "1") {
        batalhar();
    } se_não {
        se_ocê_quiser(escolha é_igualim "2") {
            local_atual é "Vila";
        } se_não {
            se_ocê_quiser(escolha é_igualim "3") {
                usar_pocao();
            }
        }
    }
}

// Função para processar ações na vila
presta_serviço processar_vila(escolha) {
    se_ocê_quiser(escolha é_igualim "1") {
        local_atual é "Loja";
    } se_não {
        se_ocê_quiser(escolha é_igualim "2") {
            local_atual é "Curandeiro";
        } se_não {
            se_ocê_quiser(escolha é_igualim "3") {
                local_atual é "Floresta";
            }
        }
    }
}

// Função principal para processar a escolha do jogador
presta_serviço processar_escolha(escolha) {
    se_ocê_quiser(escolha é_igualim "4") {
        mostrar_status();
    } se_não {
        se_ocê_quiser(escolha é_igualim "9") {
            jogando é de_jeito_nenhum;
            prosa("Obrigado por jogar!");
        } se_não {
            se_ocê_quiser(local_atual é_igualim "Vila") {
                processar_vila(escolha);
            } se_não {
                se_ocê_quiser(local_atual é_igualim "Floresta") {
                    processar_floresta(escolha);
                } se_não {
                    se_ocê_quiser(local_atual é_igualim "Loja") {
                        processar_loja(escolha);
                    } se_não {
                        se_ocê_quiser(local_atual é_igualim "Curandeiro") {
                            processar_curandeiro(escolha);
                        }
                    }
                }
            }
        }
    }
}

// ==================== FUNÇÃO PRINCIPAL ====================

// Introdução do jogo
limpar_tela();
prosa("=== RPG AVENTURA - GOIÁS QUEST ===");
prosa("Bem-vindo ao mundo de Goiás Quest!");
prosa("Você é um aventureiro em busca de fama e fortuna.");
linha_separadora();

// Solicitar nome do personagem
prosa("Como você se chama, aventureiro?");
// Em uma versão interativa, aqui receberia a entrada do nome
prosa("Digite seu nome: [Aventureiro]");
// Como não temos entrada real: heroi_nome = "Aventureiro"

pausar();

// Loop principal do jogo
enquanto_tiver(jogando) {
    mostrar_local();
    uai opcao é solicitar_opcao();
    processar_escolha(opcao);
}

// Resultado final
limpar_tela();
prosa("=== FIM DE JOGO ===");
prosa("Estatísticas finais:");
prosa("Nível alcançado: " mais heroi_nivel);
prosa("Inimigos derrotados: " mais inimigo_derrotados);
prosa("Ouro acumulado: " mais heroi_ouro);
linha_separadora();
prosa("Obrigado por jogar RPG Aventura - Goiás Quest!");