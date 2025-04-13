use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("=== Programa GoiásScript em Rust ===")    ;
println!("Data: 2025-04-13 06:53:38")    ;
println!("Usuário: Gefferson-Souza")    ;
let nome = "Gefferson"    ;
let mut contador = 0    ;
println!("Nome: {}", nome)    ;
println!("Contador inicial: {}", contador)    ;
fn saudacao(pessoa: impl std::fmt::Display) -> String {
println!("Olá, {} {}", pessoa, "!")    ;
return String::from("Saudação concluída")    ;
}
saudacao(nome)    ;
contador = contador + 1    ;
println!("Contador após incremento: {}", contador)    ;
println!("Programa concluído!")    ;
}
