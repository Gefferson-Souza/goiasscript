use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
let mut jogador_nome = "Aventureiro"    ;
let mut jogador_vida = 100    ;
let mut jogador_ataque = 15    ;
let mut jogador_ouro = 20    ;
let mut jogando = true    ;
fn linha() {
println!("----------------------------------------")    ;
}
fn pausar() {
println!("Pressione ENTER para continuar...")    ;
let _ = ler_escolha()    ;
}
fn mostrar_status() {
linha()    ;
println!("===== STATUS DO AVENTUREIRO =====")    ;
println!("Nome: {}", jogador_nome)    ;
println!("Vida: {}", jogador_vida)    ;
println!("Ataque: {}", jogador_ataque)    ;
println!("Ouro: {}", jogador_ouro)    ;
linha()    ;
pausar()    ;
}
fn batalhar() {
linha()    ;
println!("===== BATALHA! =====")    ;
let inimigo_nome = "Lobo"    ;
let mut inimigo_vida = 20    ;
let mut inimigo_ataque = 5    ;
println!("Um {} {}", inimigo_nome, " apareceu!")    ;
println!("Vida do inimigo: {}", inimigo_vida)    ;
println!("Você ataca o {} {}", inimigo_nome, "!")    ;
let mut dano = jogador_ataque - 5    ;
inimigo_vida = inimigo_vida - dano    ;
println!("Você causou {} {}", dano, " de dano!")    ;
if inimigo_vida < 1     {
println!("Você derrotou o {} {}", inimigo_nome, "!")        ;
jogador_ouro = jogador_ouro + 10        ;
println!("Você ganhou 10 de ouro!")        ;
    } else {
println!("O {} {}", inimigo_nome, " contra-atacou!")        ;
jogador_vida = jogador_vida - inimigo_ataque        ;
println!("Você perdeu {} {}", inimigo_ataque, " de vida!")        ;
    }
linha()    ;
pausar()    ;
}
fn visitar_loja() {
linha()    ;
println!("===== LOJA =====")    ;
println!("Bem-vindo à loja! Você tem {} {}", jogador_ouro, " de ouro.")    ;
println!("1. Comprar poção (10 ouro)")    ;
println!("2. Sair da loja")    ;
println!("O que deseja fazer?")    ;
let escolha = ler_escolha()    ;
if escolha == "1"     {
if jogador_ouro >= 10         {
jogador_ouro = jogador_ouro - 10            ;
jogador_vida = jogador_vida + 20            ;
println!("Você comprou uma poção e recuperou 20 de vida!")            ;
println!("Sua vida atual: {}", jogador_vida)            ;
        } else {
println!("Você não tem ouro suficiente!")            ;
        }
    }
linha()    ;
pausar()    ;
}
linha()    ;
println!("===== RPG MINI =====")    ;
println!("Bem-vindo ao RPG MINI!")    ;
linha()    ;
println!("Qual é o seu nome, aventureiro?")    ;
jogador_nome = ler_escolha()    ;
println!("Bem-vindo, {} {}", jogador_nome, "!")    ;
pausar()    ;
while jogando     {
linha()        ;
println!("===== MENU PRINCIPAL =====")        ;
println!("1. Batalhar")        ;
println!("2. Visitar a loja")        ;
println!("3. Ver status")        ;
println!("4. Sair do jogo")        ;
linha()        ;
println!("O que deseja fazer?")        ;
let escolha = ler_escolha()        ;
if escolha == "1"         {
batalhar()            ;
        } else {
if escolha == "2"             {
visitar_loja()                ;
            } else {
if escolha == "3"                 {
mostrar_status()                    ;
                } else {
if escolha == "4"                     {
jogando = false                        ;
                    }
                }
            }
        }
    }
linha()    ;
println!("===== FIM DO JOGO =====")    ;
println!("Obrigado por jogar RPG MINI!")    ;
println!("Estatísticas finais:")    ;
println!("Nome: {}", jogador_nome)    ;
println!("Ouro acumulado: {}", jogador_ouro)    ;
linha()    ;
}
