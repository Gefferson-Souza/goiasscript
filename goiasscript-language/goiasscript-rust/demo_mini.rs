use std::io::{self, Write};

// Função para ler entrada do usuário
fn read_input() -> String {
    let mut input = String::new();
    print!("> ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut input).expect("Falha ao ler entrada");
    input.trim().to_string()
}

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("=== MINI JOGO INTERATIVO EM GOIÁSSCRIPT ===")    ;
println!("Bem-vindo(a) à demonstração da interatividade!")    ;
println!("")    ;
println!("Como você se chama?")    ;
print!("> ");
io::stdout().flush().unwrap();
let mut nome = String::new();
io::stdin().read_line(&mut nome).expect("Falha ao ler entrada");
let nome = nome.trim();

println!("Olá, {}!", nome)    ;
println!("Você está em uma floresta escura.")    ;
println!("O que deseja fazer?")    ;
println!("1 - Seguir em frente")    ;
println!("2 - Voltar")    ;
print!("> ");
io::stdout().flush().unwrap();
let mut escolha = String::new();
io::stdin().read_line(&mut escolha).expect("Falha ao ler entrada");
let escolha = escolha.trim();

if escolha == "1"     {
println!("Você segue em frente e encontra um tesouro!")        ;
println!("Parabéns, {}! Você venceu!", nome)        ;
    } else {
println!("Você decide voltar e fica em segurança.")        ;
println!("Talvez na próxima aventura, {}!", nome)        ;
    }
println!("")    ;
println!("=== FIM DA DEMONSTRAÇÃO ===")    ;
println!("Obrigado por jogar!")    ;
}
