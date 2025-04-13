// Programa em GoiásScript com recursos básicos
prosa("=== Programa em GoiásScript ===");
prosa("Autor: Gefferson - Data: 13/04/2025");

// Declaração de variáveis
uai nome é "Goiás";
uai sobrenome é "Script";
trem contador é 1;
trem max é 5;

// Concatenação de strings
uai nome_completo é nome mais " " mais sobrenome;
prosa("Linguagem: " mais nome_completo);

// Função que retorna mensagem de saudação
presta_serviço saudacao(pessoa) {
    faz_favor "Olá, " mais pessoa mais "!";
}

// Chamando a função
prosa(saudacao("Programador"));

// Loop com contagem
prosa("\nContagem:");
enquanto_tiver (contador menor_que max mais 1) {
    prosa("Contador: " mais contador);
    
    // Estrutura condicional
    se_ocê_quiser (contador é_igualim 3) {
        prosa("Chegamos na metade!");
    } se_não {
        se_ocê_quiser (contador maior_que 3) {
            prosa("Passamos da metade");
        } se_não {
            prosa("Ainda não chegamos na metade");
        }
    }
    
    contador é contador mais 1;
}

prosa("Programa concluído!");