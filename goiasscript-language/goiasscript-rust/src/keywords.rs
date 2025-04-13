use std::collections::HashMap;
use once_cell::sync::Lazy;

// Mapeamento de palavras-chave GoiásScript para Rust
#[allow(dead_code)]
pub static KEYWORDS: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut map = HashMap::new();
    
    // Declarações e atribuições
    map.insert("uai", "let");
    map.insert("trem", "let mut");
    map.insert("é", "=");
    map.insert("ocê", "self");
    
    // Estruturas de controle
    map.insert("se_ocê_quiser", "if");
    map.insert("se_num_for", "else if");
    map.insert("se_não", "else");
    map.insert("vai_indo", "for");
    map.insert("enquanto_tiver", "while");
    map.insert("para_com_isso", "break");
    map.insert("continua_aí", "continue");
    
    // Funções
    map.insert("presta_serviço", "fn");
    map.insert("faz_favor", "return");
    
    // Operadores lógicos
    map.insert("e_mais", "&&");
    map.insert("ou_então", "||");
    map.insert("num_é", "!");
    map.insert("é_igualim", "==");
    map.insert("diferente", "!=");
    map.insert("maior_que", ">");
    map.insert("menor_que", "<");
    map.insert("pelo_menos", ">=");
    map.insert("no_máximo", "<=");
    
    // Operações
    map.insert("mais", "+");
    map.insert("menos", "-");
    map.insert("vezes", "*");
    map.insert("dividido", "/");
    map.insert("sobrou", "%");
    
    // Console e controle
    map.insert("prosa", "println!");
    map.insert("reclama", "eprintln!");
    map.insert("vixe", "panic!");
    map.insert("ler_escolha", "read_input");
    
    // Tipos
    map.insert("vazio", "None");
    map.insert("sei_lá", "Option::None");
    map.insert("certeza", "true");
    map.insert("de_jeito_nenhum", "false");
    
    // Async/await e concorrência
    map.insert("vai_na_frente", "async");
    map.insert("espera_um_cadim", "await");
    map.insert("promessa", "Future");
    map.insert("faz_um", "");  // Não necessário em Rust (construtores são funções)
    
    // Try/Catch e gerenciamento de erros (adaptado para Result em Rust)
    map.insert("tenta_aí", "match");
    map.insert("se_der_ruim", "Err");
    
    map
});

// Palavras que precisam de tratamento especial (não são simples substituições)
#[allow(dead_code)]
pub static SPECIAL_PATTERNS: Lazy<Vec<(&'static str, &'static str)>> = Lazy::new(|| {
    vec![
        // Funções assíncronas
        ("vai_na_frente presta_serviço", "async fn"),
        
        // Tratamento de erros (adaptado para o estilo Result de Rust)
        ("tenta_aí \\{([\\s\\S]*?)\\} se_der_ruim \\(([^)]*)\\) \\{([\\s\\S]*?)\\}", 
         "match (|| -> Result<_, _> { $1 Ok(()) })() {\n    Ok(_) => {},\n    Err($2) => { $3 }\n}"),
        
        // Formatação para println!
        ("prosa\\(\"([^\"]*)\"\\)", "println!(\"$1\")"),
        ("prosa\\(\"([^\"]*)\" \\+ (.*)\\)", "println!(\"$1 {}\", $2)"),
    ]
});