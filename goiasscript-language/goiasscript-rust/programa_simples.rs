use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("=== Programa em GoiásScript ===")    ;
println!("Autor: Gefferson - Data: 13/04/2025")    ;
let nome = "Goiás"    ;
let sobrenome = "Script"    ;
let mut contador = 1    ;
let mut max = 5    ;
let nome_completo = format!("{}{}", format!("{}{}", nome, " "), sobrenome)    ;
println!("Linguagem: {}", nome_completo)    ;
fn saudacao(pessoa: impl std::fmt::Display) -> String {
return format!("{}{}", format!("{}{}", "Olá, ", pessoa), "!")    ;
}
println!("{}", saudacao("Programador"))    ;
println!("\nContagem:")    ;
while contador < max + 1     {
println!("Contador: {}", contador)        ;
if contador == 3         {
println!("Chegamos na metade!")            ;
        } else {
if contador > 3             {
println!("Passamos da metade")                ;
            } else {
println!("Ainda não chegamos na metade")                ;
            }
        }
contador = contador + 1        ;
    }
println!("Programa concluído!")    ;
}
