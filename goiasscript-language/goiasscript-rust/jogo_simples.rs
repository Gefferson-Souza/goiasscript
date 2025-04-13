use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("============================================")    ;
println!("        AVENTURA GOIANA SIMPLES            ")    ;
println!("============================================")    ;
println!("Um jogo de texto ultra simples para testar")    ;
println!("a entrada do usuário em GoiásScript.")    ;
println!("============================================")    ;
println!("")    ;
println!("Como você se chama, aventureiro?")    ;
let mut nome = ler_escolha()    ;
println!("Olá, {} {}", nome, "! Bem-vindo à sua aventura!")    ;
println!("")    ;
println!("Você está em uma encruzilhada na estrada.")    ;
println!("Para qual direção deseja seguir?")    ;
println!("1 - Esquerda (para a floresta)")    ;
println!("2 - Direita (para a montanha)")    ;
let mut escolha = ler_escolha()    ;
if escolha == "1"     {
println!("Você escolheu seguir para a floresta.")        ;
println!("Os sons da natureza envolvem você enquanto caminha")        ;
println!("por entre árvores altas e vegetação exuberante.")        ;
println!("")        ;
println!("De repente, você encontra um tesouro escondido!")        ;
println!("Você ganhou 50 moedas de ouro!")        ;
    } else {
println!("Você escolheu seguir para a montanha.")        ;
println!("O caminho é íngreme e rochoso, mas a vista é deslumbrante.")        ;
println!("Ao chegar no topo, você avista um dragão dormindo!")        ;
println!("")        ;
println!("O que você faz?")        ;
println!("1 - Tentar passar despercebido")        ;
println!("2 - Enfrentar o dragão")        ;
let mut escolha_dragao = ler_escolha()        ;
if escolha_dragao == "1"         {
println!("Você consegue passar despercebido e encontra")            ;
println!("uma passagem secreta com um tesouro!")            ;
println!("Você ganhou 100 moedas de ouro!")            ;
        } else {
println!("Você tenta enfrentar o dragão, mas ele é muito forte!")            ;
println!("Por sorte, você consegue fugir com apenas alguns arranhões.")            ;
println!("Você ganhou 20 moedas de ouro e uma história para contar!")            ;
        }
    }
println!("")    ;
println!("============================================")    ;
println!("Obrigado por jogar, {} {}", nome, "!")    ;
println!("Essa foi apenas uma pequena demonstração.")    ;
println!("Em breve teremos um jogo completo!")    ;
println!("============================================")    ;
}
