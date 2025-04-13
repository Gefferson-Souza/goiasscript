// Teste do operador é_tipo_de em GoiásScript
prosa("=== Testando o operador é_tipo_de (instanceof) ===");

// Definindo classes para teste
arruma_trem Veiculo {
    // Propriedades
    rodas = 0;
    marca = "";
    
    // Construtor
    aprepara_trem(rodas, marca) {
        ocê.rodas é rodas;
        ocê.marca é marca;
        prosa("Veículo da marca " + ocê.marca + " com " + ocê.rodas + " rodas criado!");
    }
    
    // Método
    descreve() {
        prosa("Este é um veículo da marca " + ocê.marca);
        faz_favor ocê;
    }
}

arruma_trem Carro inherda_de Veiculo {
    // Propriedades
    modelo = "";
    
    // Construtor
    aprepara_trem(marca, modelo) {
        super(4, marca);  // Carro tem 4 rodas
        ocê.modelo é modelo;
        prosa("Carro modelo " + ocê.modelo + " adicionado!");
    }
    
    // Método
    buzina() {
        prosa("BIBI! Buzinando o " + ocê.marca + " " + ocê.modelo);
        faz_favor ocê;
    }
}

arruma_trem Moto inherda_de Veiculo {
    // Construtor
    aprepara_trem(marca) {
        super(2, marca);  // Moto tem 2 rodas
        prosa("Moto criada!");
    }
    
    // Método
    empina() {
        prosa("Empinando a " + ocê.marca + "!");
        faz_favor ocê;
    }
}

// Criando instâncias
prosa("\n1. Criando veículos:");
uai fusca é faz_um Carro("Volkswagen", "Fusca");
uai honda é faz_um Moto("Honda");
uai generico é faz_um Veiculo(0, "Desconhecido");

// Testando o operador é_tipo_de (instanceof)
prosa("\n2. Verificando tipos com é_tipo_de:");

// Verificando o tipo do fusca
prosa("O fusca é um Carro? " + (fusca é_tipo_de Carro ? "Sim!" : "Não!"));
prosa("O fusca é um Veiculo? " + (fusca é_tipo_de Veiculo ? "Sim!" : "Não!"));
prosa("O fusca é uma Moto? " + (fusca é_tipo_de Moto ? "Sim!" : "Não!"));

// Verificando o tipo da honda
prosa("\nA honda é uma Moto? " + (honda é_tipo_de Moto ? "Sim!" : "Não!"));
prosa("A honda é um Veiculo? " + (honda é_tipo_de Veiculo ? "Sim!" : "Não!"));
prosa("A honda é um Carro? " + (honda é_tipo_de Carro ? "Sim!" : "Não!"));

// Usando é_tipo_de em condicionais
prosa("\n3. Usando é_tipo_de em condicionais:");

presta_serviço fazerVeiculoFuncionar(veiculo) {
    prosa("Testando veículo...");
    
    se_ocê_quiser (veiculo é_tipo_de Carro) {
        veiculo.buzina();
    } se_num_for (veiculo é_tipo_de Moto) {
        veiculo.empina();
    } se_não {
        veiculo.descreve();
    }
}

fazerVeiculoFuncionar(fusca);   // Deve buzinar
fazerVeiculoFuncionar(honda);   // Deve empinar
fazerVeiculoFuncionar(generico); // Deve descrever