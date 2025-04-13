// Exemplo simples de classes em GoiásScript
prosa("=== Exemplo Simples de Classes em GoiásScript ===");

// Definição de uma classe Animal usando as palavras-chave goianas
arruma_trem Animal {
    // Propriedades
    nome = "";
    tipo = "desconhecido";
    
    // Construtor
    aprepara_trem(nome, tipo) {
        ocê.nome é nome;
        ocê.tipo é tipo;
        prosa("Bicho " + ocê.nome + " da espécie " + ocê.tipo + " foi criado!");
    }
    
    // Métodos
    faizBaruio() {
        prosa(ocê.nome + " está fazendo barulho!");
        faz_favor ocê;
    }
    
    mexe() {
        prosa(ocê.nome + " está se mexendo!");
        faz_favor ocê;
    }
}

// Definição de uma classe que herda de Animal
arruma_trem Cachorro inherda_de Animal {
    // Propriedades específicas de cachorro
    raça = "vira-lata";
    
    // Construtor
    aprepara_trem(nome, raça) {
        // Chama o construtor da classe pai com 'cachorro' como tipo
        super(nome, "cachorro");
        ocê.raça é raça;
        prosa("Cachorro da raça " + ocê.raça + " foi adicionado!");
    }
    
    // Sobrescreve o método da classe pai
    faizBaruio() {
        prosa(ocê.nome + " faz: Au au!");
        faz_favor ocê;
    }
    
    // Método específico de cachorro
    abanaRabo() {
        prosa(ocê.nome + " está abanando o rabo!");
        faz_favor ocê;
    }

    // Método que retorna um trem bão (um cachorro feliz)
    getTremBão() {
        prosa("Preparando um trem bão...");
        
        uai cachorroBão é {
            nome: ocê.nome,
            raça: ocê.raça,
            humor: "feliz demais da conta",
            vacinado: certeza,
            idade: "3 anos"
        };
        
        prosa("Ó o cachorro feliz aqui, sô!");
        faz_favor cachorroBão;
    }
}

// Testando as classes
prosa("\n1. Criando um animal genérico:");
uai bicho é faz_um Animal("Zé Bicho", "desconhecido");
bicho.faizBaruio()
     .mexe();

prosa("\n2. Criando um cachorro:");
uai dog é faz_um Cachorro("Totó", "caramelo");
dog.faizBaruio()
   .mexe()
   .abanaRabo();

// Verificando herança
prosa("\n3. Verificando herança:");
prosa("Totó é um cachorro? " + (dog instanceof Cachorro ? "Sim!" : "Não!"));
prosa("Totó é um animal? " + (dog instanceof Animal ? "Sim!" : "Não!"));

// Testando o método getTremBão
prosa("\n4. Pegando o trem bão (cachorro feliz):");
uai cachorroBão é dog.getTremBão();
prosa("Nome: " + cachorroBão.nome);
prosa("Raça: " + cachorroBão.raça);
prosa("Humor: " + cachorroBão.humor);
prosa("Vacinado: " + (cachorroBão.vacinado ? "Sim!" : "Não!"));
prosa("Idade: " + cachorroBão.idade);