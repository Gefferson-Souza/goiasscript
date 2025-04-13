// Programa avançado em GoiásScript demonstrando várias funcionalidades
prosa("=== Programa Avançado em GoiásScript ===");
prosa("Autor: Gefferson - Data: 13/04/2025");

// Declaração de variáveis
uai nome é "Goiás";
uai sobrenome é "Script";
trem total é 0;
trem contador é 1;
trem max é 5;

// Concatenação de strings
uai nome_completo é nome mais " " mais sobrenome;
prosa("Linguagem: " mais nome_completo);

// Função que retorna mensagem de saudação
presta_serviço saudacao(pessoa) {
    faz_favor "Olá, " mais pessoa mais "!";
}

// Função que aplica saudação a cada pessoa
presta_serviço saudar_todos() {
    prosa(saudacao("Joaquim"));
    prosa(saudacao("Maria"));
    prosa(saudacao("Pedro"));
}

// Chamando a função
prosa("Enviando saudações:");
saudar_todos();

// Loop com contagem
prosa("\nContagem:");
enquanto_tiver (contador menor_que max mais 1) {
    total é total mais contador;
    prosa("Contador: " mais contador mais " - Total: " mais total);
    
    // Estrutura condicional
    se_ocê_quiser (contador é_igualim 3) {
        prosa("Chegamos na metade!");
    } se_não {
        se_ocê_quiser (contador maior_que 3) {
            prosa("Já passamos da metade");
        } se_não {
            prosa("Ainda não chegamos na metade");
        }
    }
    
    contador é contador mais 1;
}

// Exemplos de cálculos simples
trem a é 10;
trem b é 5;
trem soma é a mais b;
trem diferenca é a menos b;
trem produto é a vezes b;
trem divisao é a dividido b;

prosa("\nResultados de cálculos:");
prosa("Soma: " mais soma);
prosa("Diferença: " mais diferenca);
prosa("Produto: " mais produto);
prosa("Divisão: " mais divisao);

prosa("\nTotal final da contagem: " mais total);
prosa("Programa concluído com sucesso!");