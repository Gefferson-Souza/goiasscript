use std::io::{self, Write};

// Código gerado automaticamente pelo compilador GoiásScript
// Data: 2025-04-13 06:45:02
// Autor: Gefferson-Souza

fn main() {
println!("=== Programa Avançado em GoiásScript ===")    ;
println!("Autor: Gefferson - Data: 13/04/2025")    ;
let nome = "Goiás"    ;
let sobrenome = "Script"    ;
let mut total = 0    ;
let mut contador = 1    ;
let mut max = 5    ;
let nome_completo = format!("{}{}", format!("{}{}", nome, " "), sobrenome)    ;
println!("Linguagem: {}", nome_completo)    ;
fn saudacao(pessoa: impl std::fmt::Display) -> String {
return format!("{}{}", format!("{}{}", "Olá, ", pessoa), "!")    ;
}
fn saudar_todos() {
println!("{}", saudacao("Joaquim"))    ;
println!("{}", saudacao("Maria"))    ;
println!("{}", saudacao("Pedro"))    ;
}
println!("Enviando saudações:")    ;
saudar_todos()    ;
println!("\nContagem:")    ;
while contador < max + 1     {
total = total + contador        ;
println!("{}", format!("{}{}", format!("{}{}", "Contador: {}", contador, " - Total: "), total))        ;
if contador == 3         {
println!("Chegamos na metade!")            ;
        } else {
if contador > 3             {
println!("Já passamos da metade")                ;
            } else {
println!("Ainda não chegamos na metade")                ;
            }
        }
contador = contador + 1        ;
    }
let mut a = 10    ;
let mut b = 5    ;
let mut soma = a + b    ;
let mut diferenca = a - b    ;
let mut produto = a * b    ;
let mut divisao = a / b    ;
println!("\nResultados de cálculos:")    ;
println!("Soma: {}", soma)    ;
println!("Diferença: {}", diferenca)    ;
println!("Produto: {}", produto)    ;
println!("Divisão: {}", divisao)    ;
println!("\nTotal final da contagem: {}", total)    ;
println!("Programa concluído com sucesso!")    ;
}
