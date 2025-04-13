use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("=== Programa GoiásScript em Rust ===")    ;
let nome = "Gefferson"    ;
let mut contador = 0    ;
println!("Nome: {}", nome)    ;
fn saudacao(pessoa: impl std::fmt::Display) {
println!("Olá, {}", pessoa + "!")    ;
return "Saudação concluída"    ;
}
saudacao(nome)    ;
println!("Programa concluído!")    ;
}
