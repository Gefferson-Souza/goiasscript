use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
let mut heroi_nome = "Aventureiro"    ;
let mut heroi_vida = 100    ;
let mut heroi_ataque = 15    ;
let mut heroi_defesa = 10    ;
let mut heroi_nivel = 1    ;
let mut heroi_experiencia = 0    ;
let mut heroi_experiencia_proxnivel = 100    ;
let mut heroi_ouro = 50    ;
let mut heroi_pocoes = 3    ;
let mut local_atual = "Vila"    ;
let mut inimigo_derrotados = 0    ;
let mut jogando = true    ;
fn linha_separadora() {
println!("----------------------------------------")    ;
}
fn solicitar_opcao() -> String {
println!("Digite sua escolha: ")    ;
return String::from("1")    ;
}
fn limpar_tela() {
println!("\n\n\n\n\n")    ;
linha_separadora()    ;
}
fn pausar() {
println!("Pressione ENTER para continuar...")    ;
}
fn mostrar_status() {
limpar_tela()    ;
println!("===== STATUS DO HERÓI =====")    ;
println!("Nome: {}", heroi_nome)    ;
println!("Nível: {}", heroi_nivel)    ;
println!("Vida: {}", heroi_vida)    ;
println!("Ataque: {}", heroi_ataque)    ;
println!("Defesa: {}", heroi_defesa)    ;
println!("{}", format!("{}{}", format!("{}{}", "Experiência: {}", heroi_experiencia, "/"), heroi_experiencia_proxnivel))    ;
println!("Ouro: {}", heroi_ouro)    ;
println!("Poções: {}", heroi_pocoes)    ;
linha_separadora()    ;
pausar()    ;
}
fn mostrar_local() {
limpar_tela()    ;
linha_separadora()    ;
println!("Você está em: {}", local_atual)    ;
if local_atual == "Vila"     {
println!("Uma vila pacífica com uma loja de itens e curandeiros.")        ;
println!("O que você deseja fazer?")        ;
println!("1. Visitar a loja")        ;
println!("2. Visitar o curandeiro")        ;
println!("3. Sair para a floresta")        ;
println!("4. Ver status")        ;
println!("9. Sair do jogo")        ;
    } else {
if local_atual == "Floresta"         {
println!("Uma floresta densa e perigosa cheia de inimigos.")            ;
println!("O que você deseja fazer?")            ;
println!("1. Procurar inimigos")            ;
println!("2. Voltar para a vila")            ;
println!("3. Usar poção (restaura 30 de vida)")            ;
println!("4. Ver status")            ;
println!("9. Sair do jogo")            ;
        } else {
if local_atual == "Loja"             {
println!("Uma loja com itens diversos. Você tem {} {}", heroi_ouro, " de ouro.")                ;
println!("O que você deseja fazer?")                ;
println!("1. Comprar poção (20 ouro)")                ;
println!("2. Melhorar arma (50 ouro, +5 ataque)")                ;
println!("3. Melhorar armadura (50 ouro, +5 defesa)")                ;
println!("4. Voltar para a vila")                ;
println!("9. Sair do jogo")                ;
            } else {
if local_atual == "Curandeiro"                 {
println!("O curandeiro pode restaurar sua vida por 10 de ouro.")                    ;
println!("O que você deseja fazer?")                    ;
println!("1. Curar-se completamente (10 ouro)")                    ;
println!("2. Voltar para a vila")                    ;
println!("9. Sair do jogo")                    ;
                } else {
println!("Local desconhecido! Voltando para a vila...")                    ;
local_atual = "Vila"                    ;
                }
            }
        }
    }
linha_separadora()    ;
}
fn usar_pocao() {
if heroi_pocoes > 0     {
heroi_pocoes = heroi_pocoes - 1        ;
heroi_vida = heroi_vida + 30        ;
if heroi_vida > 100         {
heroi_vida = 100            ;
        }
println!("Você usou uma poção! Sua vida atual é: {}", heroi_vida)        ;
    } else {
println!("Você não tem poções!")        ;
    }
pausar()    ;
}
fn verificar_nivel() {
if heroi_experiencia >= heroi_experiencia_proxnivel     {
heroi_nivel = heroi_nivel + 1        ;
heroi_ataque = heroi_ataque + 3        ;
heroi_defesa = heroi_defesa + 2        ;
heroi_vida = 100        ;
heroi_experiencia = heroi_experiencia - heroi_experiencia_proxnivel        ;
heroi_experiencia_proxnivel = heroi_experiencia_proxnivel + heroi_experiencia_proxnivel / 2        ;
limpar_tela()        ;
println!("=== PARABÉNS! VOCÊ SUBIU DE NÍVEL! ===")        ;
println!("Novo nível: {}", heroi_nivel)        ;
println!("Ataque aumentou para: {}", heroi_ataque)        ;
println!("Defesa aumentou para: {}", heroi_defesa)        ;
println!("Sua vida foi restaurada!")        ;
linha_separadora()        ;
pausar()        ;
    }
}
fn gerar_inimigo() -> String {
let mut inimigo_nome = "Goblin"    ;
let mut inimigo_vida = 50 + heroi_nivel * 5    ;
let mut inimigo_ataque = 8 + heroi_nivel * 2    ;
let mut inimigo_defesa = 5 + heroi_nivel    ;
let mut inimigo_ouro = 10 + heroi_nivel * 3    ;
let mut inimigo_exp = 30 + heroi_nivel * 10    ;
return inimigo_nome    ;
}
fn batalhar() {
let inimigo_nome = gerar_inimigo()    ;
let mut inimigo_vida = 50 + heroi_nivel * 5    ;
let mut inimigo_ataque = 8 + heroi_nivel * 2    ;
let mut inimigo_defesa = 5 + heroi_nivel    ;
let mut inimigo_ouro = 10 + heroi_nivel * 3    ;
let mut inimigo_exp = 30 + heroi_nivel * 10    ;
limpar_tela()    ;
println!("=== BATALHA INICIADA! ===")    ;
println!("Um {} {}", inimigo_nome, " apareceu!")    ;
println!("Vida do inimigo: {}", inimigo_vida)    ;
linha_separadora()    ;
let mut turno = 1    ;
while inimigo_vida > 0 && heroi_vida > 0     {
println!("-- Turno {} {}", turno, " --")        ;
let mut dano_ao_inimigo = heroi_ataque - inimigo_defesa / 2        ;
if dano_ao_inimigo < 1         {
dano_ao_inimigo = 1            ;
        }
inimigo_vida = inimigo_vida - dano_ao_inimigo        ;
println!("{}", format!("{}{}", format!("{}{}", format!("{}{}", "Você atacou o {}", inimigo_nome, " causando "), dano_ao_inimigo), " de dano!"))        ;
if inimigo_vida >= 1         {
let mut dano_ao_heroi = inimigo_ataque - heroi_defesa / 2            ;
if dano_ao_heroi < 1             {
dano_ao_heroi = 1                ;
            }
heroi_vida = heroi_vida - dano_ao_heroi            ;
println!("{}", format!("{}{}", format!("{}{}", format!("{}{}", inimigo_nome, " atacou você causando "), dano_ao_heroi), " de dano!"))            ;
println!("{}", format!("{}{}", format!("{}{}", "Sua vida: {}", heroi_vida, " | Vida do inimigo: "), inimigo_vida))            ;
        } else {
inimigo_vida = 0            ;
println!("O {} {}", inimigo_nome, " foi derrotado!")            ;
        }
turno = turno + 1        ;
pausar()        ;
    }
if inimigo_vida >= 1     {
limpar_tela()        ;
println!("=== VOCÊ FOI DERROTADO! ===")        ;
println!("O jogo terminou!")        ;
jogando = false        ;
    } else {
limpar_tela()        ;
println!("=== VITÓRIA! ===")        ;
println!("Você derrotou o {} {}", inimigo_nome, "!")        ;
println!("Ganhou {} {}", inimigo_ouro, " de ouro!")        ;
println!("Ganhou {} {}", inimigo_exp, " de experiência!")        ;
heroi_ouro = heroi_ouro + inimigo_ouro        ;
heroi_experiencia = heroi_experiencia + inimigo_exp        ;
inimigo_derrotados = inimigo_derrotados + 1        ;
linha_separadora()        ;
pausar()        ;
verificar_nivel()        ;
    }
}
fn processar_loja(escolha: impl std::fmt::Display) {
if escolha == "1"     {
if heroi_ouro >= 20         {
heroi_ouro = heroi_ouro - 20            ;
heroi_pocoes = heroi_pocoes + 1            ;
println!("Você comprou uma poção! Agora tem {} {}", heroi_pocoes, " poções.")            ;
        } else {
println!("Ouro insuficiente para comprar poção!")            ;
        }
pausar()        ;
    } else {
if escolha == "2"         {
if heroi_ouro >= 50             {
heroi_ouro = heroi_ouro - 50                ;
heroi_ataque = heroi_ataque + 5                ;
println!("Você melhorou sua arma! Seu ataque agora é {}", heroi_ataque)                ;
            } else {
println!("Ouro insuficiente para melhorar arma!")                ;
            }
pausar()            ;
        } else {
if escolha == "3"             {
if heroi_ouro >= 50                 {
heroi_ouro = heroi_ouro - 50                    ;
heroi_defesa = heroi_defesa + 5                    ;
println!("Você melhorou sua armadura! Sua defesa agora é {}", heroi_defesa)                    ;
                } else {
println!("Ouro insuficiente para melhorar armadura!")                    ;
                }
pausar()                ;
            } else {
if escolha == "4"                 {
local_atual = "Vila"                    ;
                }
            }
        }
    }
}
fn processar_curandeiro(escolha: impl std::fmt::Display) {
if escolha == "1"     {
if heroi_ouro >= 10         {
heroi_ouro = heroi_ouro - 10            ;
heroi_vida = 100            ;
println!("Você foi curado completamente! Sua vida agora é 100.")            ;
        } else {
println!("Ouro insuficiente para se curar!")            ;
        }
pausar()        ;
    } else {
if escolha == "2"         {
local_atual = "Vila"            ;
        }
    }
}
fn processar_floresta(escolha: impl std::fmt::Display) {
if escolha == "1"     {
batalhar()        ;
    } else {
if escolha == "2"         {
local_atual = "Vila"            ;
        } else {
if escolha == "3"             {
usar_pocao()                ;
            }
        }
    }
}
fn processar_vila(escolha: impl std::fmt::Display) {
if escolha == "1"     {
local_atual = "Loja"        ;
    } else {
if escolha == "2"         {
local_atual = "Curandeiro"            ;
        } else {
if escolha == "3"             {
local_atual = "Floresta"                ;
            }
        }
    }
}
fn processar_escolha(escolha: impl std::fmt::Display) {
if escolha == "4"     {
mostrar_status()        ;
    } else {
if escolha == "9"         {
jogando = false            ;
println!("Obrigado por jogar!")            ;
        } else {
if local_atual == "Vila"             {
processar_vila(escolha)                ;
            } else {
if local_atual == "Floresta"                 {
processar_floresta(escolha)                    ;
                } else {
if local_atual == "Loja"                     {
processar_loja(escolha)                        ;
                    } else {
if local_atual == "Curandeiro"                         {
processar_curandeiro(escolha)                            ;
                        }
                    }
                }
            }
        }
    }
}
limpar_tela()    ;
println!("=== RPG AVENTURA - GOIÁS QUEST ===")    ;
println!("Bem-vindo ao mundo de Goiás Quest!")    ;
println!("Você é um aventureiro em busca de fama e fortuna.")    ;
linha_separadora()    ;
println!("Como você se chama, aventureiro?")    ;
println!("Digite seu nome: [Aventureiro]")    ;
pausar()    ;
while jogando     {
mostrar_local()        ;
let opcao = solicitar_opcao()        ;
processar_escolha(opcao)        ;
    }
limpar_tela()    ;
println!("=== FIM DE JOGO ===")    ;
println!("Estatísticas finais:")    ;
println!("Nível alcançado: {}", heroi_nivel)    ;
println!("Inimigos derrotados: {}", inimigo_derrotados)    ;
println!("Ouro acumulado: {}", heroi_ouro)    ;
linha_separadora()    ;
println!("Obrigado por jogar RPG Aventura - Goiás Quest!")    ;
}
