use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("============================================")    ;
println!("        MINI AVENTURA EM GOIÁS             ")    ;
println!("============================================")    ;
println!("Bem-vindo à mini aventura em GoiásScript!")    ;
println!("Uma jornada textual simples com algumas escolhas.")    ;
println!("============================================")    ;
println!("")    ;
println!("Como você se chama, aventureiro?")    ;
let mut nome = ler_escolha()    ;
println!("Bem-vindo, {} {}", nome, "! Sua aventura começa agora!")    ;
println!("")    ;
println!("Pressione ENTER para continuar...")    ;
let mut _ = ler_escolha()    ;
println!("============================================")    ;
println!("Você acorda em uma pequena vila. O sol brilha e")    ;
println!("os pássaros cantam. Você se sente disposto a")    ;
println!("iniciar sua jornada como aventureiro.")    ;
println!("")    ;
println!("Você tem 50 moedas de ouro e uma espada básica.")    ;
println!("")    ;
println!("O que você deseja fazer?")    ;
println!("1 - Visitar a loja de armas")    ;
println!("2 - Explorar a floresta próxima")    ;
let mut escolha1 = ler_escolha()    ;
if escolha1 == "1"     {
println!("Você caminha até a loja de armas da vila.")        ;
println!("O ferreiro te cumprimenta:")        ;
println!("'Olá {} {}", nome, "! O que procura hoje?'")        ;
println!("")        ;
println!("1 - Comprar espada melhor (40 moedas)")        ;
println!("2 - Apenas olhar e sair")        ;
let mut escolha_loja = ler_escolha()        ;
if escolha_loja == "1"         {
println!("Você compra uma espada de aço brilhante!")            ;
println!("Sua força de ataque aumentou!")            ;
println!("Restam 10 moedas de ouro.")            ;
println!("")            ;
println!("Agora você decide explorar a floresta com sua nova arma.")            ;
        } else {
println!("Você decide não comprar nada e sair da loja.")            ;
println!("Você ainda tem 50 moedas de ouro.")            ;
println!("")            ;
println!("Você decide explorar a floresta com sua espada básica.")            ;
        }
    } else {
println!("Você decide ir direto para a floresta com sua espada básica.")        ;
println!("Você ainda tem todas as suas 50 moedas de ouro.")        ;
    }
println!("Pressione ENTER para continuar...")    ;
let mut _ = ler_escolha()    ;
println!("============================================")    ;
println!("Você adentra a Floresta Sombria...")    ;
println!("As árvores são altas e bloqueiam grande parte da luz solar.")    ;
println!("De repente, você ouve um barulho nos arbustos próximos!")    ;
println!("")    ;
println!("É um Goblin! Ele parece hostil e avança em sua direção!")    ;
println!("")    ;
println!("O que você faz?")    ;
println!("1 - Lutar contra o Goblin")    ;
println!("2 - Tentar fugir")    ;
let mut escolha_floresta = ler_escolha()    ;
if escolha_floresta == "1"     {
println!("Você empunha sua espada e enfrenta o Goblin!")        ;
if escolha1 == "1" && escolha_loja == "1"         {
println!("Com sua nova espada de aço, você rapidamente derrota o Goblin!")            ;
println!("Você encontrou 30 moedas de ouro e uma poção de cura!")            ;
println!("Agora você tem 40 moedas no total.")            ;
        } else {
println!("Com sua espada básica, você luta bravamente.")            ;
println!("Após um combate difícil, você consegue derrotar o Goblin!")            ;
println!("Você sofreu alguns ferimentos, mas encontrou 30 moedas de ouro!")            ;
println!("Agora você tem 80 moedas no total.")            ;
        }
    } else {
println!("Você tenta escapar do Goblin...")        ;
println!("Você corre rapidamente entre as árvores!")        ;
println!("Por sorte, consegue despistar o monstro, mas deixa cair 10 moedas.")        ;
if escolha1 == "1" && escolha_loja == "1"         {
println!("Agora você tem apenas 0 moedas.")            ;
        } else {
println!("Agora você tem 40 moedas.")            ;
        }
    }
println!("Pressione ENTER para continuar...")    ;
let mut _ = ler_escolha()    ;
println!("============================================")    ;
println!("Após sua aventura na floresta, você retorna à vila.")    ;
println!("As pessoas te recebem como um herói quando ouvem sobre")    ;
println!("sua encontro com o Goblin na floresta.")    ;
println!("")    ;
println!("Parabéns, {} {}", nome, "!")    ;
println!("Você completou com sucesso sua primeira aventura!")    ;
println!("")    ;
if escolha_floresta == "1"     {
println!("Por derrotar o Goblin, você ganhou respeito na vila")        ;
println!("e agora é conhecido como um bravo guerreiro!")        ;
    } else {
println!("Embora tenha fugido desta vez, você ganhou conhecimento")        ;
println!("sobre os perigos da floresta e estará mais preparado na próxima!")        ;
    }
println!("")    ;
println!("============================================")    ;
println!("             FIM DA AVENTURA               ")    ;
println!("============================================")    ;
println!("Obrigado por jogar esta mini aventura em GoiásScript!")    ;
println!("Aguarde por versões futuras com mais conteúdo!")    ;
println!("")    ;
println!("Pressione ENTER para sair...")    ;
let mut _ = ler_escolha()    ;
}
