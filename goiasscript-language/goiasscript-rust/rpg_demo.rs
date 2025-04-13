use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
fn linha_separadora() {
println!("----------------------------------------")    ;
}
fn mostrar_titulo(titulo: impl std::fmt::Display) {
linha_separadora()    ;
println!("{}", titulo)    ;
linha_separadora()    ;
}
fn descrever_vila() {
println!("Você está na Vila dos Aventureiros.")    ;
println!("Um lugar pacífico com lojas, taverna e muitos aventureiros.")    ;
println!("Daqui você pode explorar as terras de Goiás.")    ;
}
fn descrever_floresta() {
println!("Você está na Floresta Sombria.")    ;
println!("Uma floresta densa com árvores altas e muitos perigos.")    ;
println!("Cuidado com os monstros que habitam este lugar!")    ;
}
fn mostrar_menu() {
println!("O que você deseja fazer?")    ;
println!("1. Explorar a Vila")    ;
println!("2. Aventurar-se na Floresta")    ;
println!("3. Ver status do herói")    ;
println!("4. Encerrar aventura")    ;
}
fn mostrar_status_heroi(nome: impl std::fmt::Display, classe: impl std::fmt::Display, nivel: impl std::fmt::Display, vida: impl std::fmt::Display) {
mostrar_titulo("STATUS DO HERÓI")    ;
println!("Nome: {}", nome)    ;
println!("Classe: {}", classe)    ;
println!("Nível: {}", nivel)    ;
println!("Pontos de vida: {}", vida)    ;
}
fn simular_batalha() {
mostrar_titulo("BATALHA")    ;
println!("Você encontrou um Goblin!")    ;
println!("Você ataca com sua espada...")    ;
println!("O Goblin é derrotado!")    ;
println!("Você ganhou 10 pontos de experiência e 5 moedas de ouro.")    ;
}
mostrar_titulo("RPG AVENTURA - GOIÁS QUEST")    ;
println!("Bem-vindo ao mundo de Goiás Quest!")    ;
println!("Uma terra mágica cheia de aventuras e perigos.")    ;
println!("Você é um aventureiro em busca de fama e fortuna.")    ;
linha_separadora()    ;
let heroi_nome = "Araújo"    ;
let heroi_classe = "Guerreiro"    ;
let heroi_nivel = "1"    ;
let heroi_vida = "100"    ;
mostrar_status_heroi(heroi_nome, heroi_classe, heroi_nivel, heroi_vida)    ;
mostrar_titulo("INÍCIO DA AVENTURA")    ;
println!("Você acorda na vila dos aventureiros...")    ;
println!("Um novo dia de aventuras o aguarda!")    ;
linha_separadora()    ;
descrever_vila()    ;
linha_separadora()    ;
println!("\nVocê decide explorar os arredores...")    ;
descrever_floresta()    ;
linha_separadora()    ;
println!("\nSúbito, você ouve um barulho nos arbustos!")    ;
simular_batalha()    ;
mostrar_titulo("FIM DA DEMONSTRAÇÃO")    ;
println!("Esta foi apenas uma pequena demonstração das funcionalidades do jogo.")    ;
println!("Em uma versão completa, você poderia:")    ;
println!("- Explorar diferentes locais")    ;
println!("- Lutar contra diversos monstros")    ;
println!("- Evoluir seu personagem")    ;
println!("- Coletar itens e equipamentos")    ;
println!("- Completar missões e desafios")    ;
mostrar_titulo("OBRIGADO POR JOGAR!")    ;
println!("Desenvolvido com GoiásScript")    ;
}
