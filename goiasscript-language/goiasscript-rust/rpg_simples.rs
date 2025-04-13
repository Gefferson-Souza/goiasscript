use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
fn linha_separadora() {
println!("----------------------------------------")    ;
}
fn pausar() {
println!("Pressione ENTER para continuar...")    ;
}
fn gerar_inimigo_nome() -> String {
return String::from("Goblin")    ;
}
fn gerar_inimigo_forca() -> String {
return 5    ;
}
fn gerar_recompensa() -> String {
return 10    ;
}
fn mostrar_heroi(nome: impl std::fmt::Display, nivel: impl std::fmt::Display, vida: impl std::fmt::Display, ataque: impl std::fmt::Display, defesa: impl std::fmt::Display, ouro: impl std::fmt::Display) {
println!("===== STATUS DO HERÓI =====")    ;
println!("Nome: {}", nome)    ;
println!("Nível: {}", nivel)    ;
println!("Vida: {}", vida)    ;
println!("Ataque: {}", ataque)    ;
println!("Defesa: {}", defesa)    ;
println!("Ouro: {}", ouro)    ;
linha_separadora()    ;
}
fn simular_batalha(heroi_nome: impl std::fmt::Display, heroi_ataque: impl std::fmt::Display, inimigo_nome: impl std::fmt::Display, inimigo_forca: impl std::fmt::Display) {
println!("=== BATALHA INICIADA! ===")    ;
println!("{}", format!("{}{}", format!("{}{}", format!("{}{}", heroi_nome, " encontrou um "), inimigo_nome), "!"))    ;
println!("{}", format!("{}{}", format!("{}{}", heroi_nome, " ataca com força "), heroi_ataque))    ;
if heroi_ataque > inimigo_forca     {
println!("Você derrotou o {} {}", inimigo_nome, "!")        ;
println!("Você ganhou experiência e ouro!")        ;
return true        ;
    } else {
println!("O {} {}", inimigo_nome, " é muito forte!")        ;
println!("Você perdeu a batalha.")        ;
return false        ;
    }
}
fn comprar_item(item_nome: impl std::fmt::Display, item_preco: impl std::fmt::Display, ouro_atual: impl std::fmt::Display) {
println!("Tentando comprar: {}", item_nome)    ;
println!("Preço: {} {}", item_preco, " ouro")    ;
if ouro_atual >= item_preco     {
println!("Compra realizada com sucesso!")        ;
return ouro_atual - item_preco        ;
    } else {
println!("Ouro insuficiente para comprar este item!")        ;
return ouro_atual        ;
    }
}
fn descrever_local(nome_local: impl std::fmt::Display) {
linha_separadora()    ;
println!("Você está em: {}", nome_local)    ;
if nome_local == "Vila"     {
println!("Uma vila pacífica com uma loja de itens e curandeiros.")        ;
println!("O que você deseja fazer?")        ;
println!("1. Visitar a loja")        ;
println!("2. Visitar o curandeiro")        ;
println!("3. Sair para a floresta")        ;
println!("4. Ver status")        ;
println!("9. Sair do jogo")        ;
    } else {
if nome_local == "Floresta"         {
println!("Uma floresta densa e perigosa cheia de inimigos.")            ;
println!("O que você deseja fazer?")            ;
println!("1. Procurar inimigos")            ;
println!("2. Voltar para a vila")            ;
println!("9. Sair do jogo")            ;
        } else {
if nome_local == "Loja"             {
println!("Uma loja com itens diversos.")                ;
println!("O que você deseja fazer?")                ;
println!("1. Comprar poção (20 ouro)")                ;
println!("2. Comprar arma melhor (50 ouro)")                ;
println!("3. Voltar para a vila")                ;
println!("9. Sair do jogo")                ;
            } else {
if nome_local == "Curandeiro"                 {
println!("O curandeiro pode restaurar sua vida por 10 de ouro.")                    ;
println!("O que você deseja fazer?")                    ;
println!("1. Curar-se completamente (10 ouro)")                    ;
println!("2. Voltar para a vila")                    ;
println!("9. Sair do jogo")                    ;
                } else {
println!("Local desconhecido!")                    ;
                }
            }
        }
    }
linha_separadora()    ;
}
fn aventura_floresta() -> String {
let mensagens = "Você caminha pela floresta densa..."    ;
return mensagens    ;
}
let heroi_nome = "Aventureiro"    ;
let mut heroi_vida = 100    ;
let mut heroi_ataque = 15    ;
let mut heroi_defesa = 10    ;
let mut heroi_nivel = 1    ;
let mut heroi_ouro = 50    ;
println!("=== RPG AVENTURA - GOIÁS QUEST ===")    ;
println!("Bem-vindo ao mundo de Goiás Quest!")    ;
println!("Você é um aventureiro em busca de fama e fortuna.")    ;
linha_separadora()    ;
mostrar_heroi(heroi_nome, heroi_nivel, heroi_vida, heroi_ataque, heroi_defesa, heroi_ouro)    ;
pausar()    ;
println!("\n=== DEMONSTRAÇÃO DO JOGO ===")    ;
descrever_local("Vila")    ;
pausar()    ;
descrever_local("Floresta")    ;
pausar()    ;
descrever_local("Loja")    ;
pausar()    ;
println!("\n=== DEMONSTRANDO BATALHA ===")    ;
let inimigo_nome = gerar_inimigo_nome()    ;
let mut inimigo_forca = gerar_inimigo_forca()    ;
let resultado_batalha = simular_batalha(heroi_nome, heroi_ataque, inimigo_nome, inimigo_forca)    ;
if resultado_batalha     {
println!("Parabéns pela vitória!")        ;
heroi_ouro = heroi_ouro + gerar_recompensa()        ;
println!("Seu ouro atual: {}", heroi_ouro)        ;
    } else {
println!("Mais sorte na próxima vez!")        ;
    }
pausar()    ;
println!("\n=== DEMONSTRANDO COMPRAS ===")    ;
let item_nome = "Poção de Cura"    ;
let mut item_preco = 20    ;
heroi_ouro = comprar_item(item_nome, item_preco, heroi_ouro)    ;
println!("Ouro restante: {}", heroi_ouro)    ;
let item_nome2 = "Espada Mágica"    ;
let mut item_preco2 = 100    ;
heroi_ouro = comprar_item(item_nome2, item_preco2, heroi_ouro)    ;
println!("Ouro restante: {}", heroi_ouro)    ;
println!("\n=== FIM DA DEMONSTRAÇÃO ===")    ;
println!("Estatísticas finais:")    ;
mostrar_heroi(heroi_nome, heroi_nivel, heroi_vida, heroi_ataque, heroi_defesa, heroi_ouro)    ;
println!("Obrigado por jogar RPG Aventura - Goiás Quest!")    ;
linha_separadora()    ;
}
