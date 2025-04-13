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
    
    // Método para o animal fazer barulho
    mexe_assim faizBaruio() {
        prosa(ocê.nome + " está fazendo barulho!");
        faz_favor ocê;
    }
    
    // Método para o animal se movimentar
    mexe_assim mexe() {
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
    mexe_assim faizBaruio() {
        prosa(ocê.nome + " faz: Au au!");
        faz_favor ocê;
    }
    
    // Método específico de cachorro
    mexe_assim abanaRabo() {
        prosa(ocê.nome + " está abanando o rabo!");
        faz_favor ocê;
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