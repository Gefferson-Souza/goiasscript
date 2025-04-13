// Teste de classes em GoiásScript com sintaxe bem goiana do interior
prosa("=== Teste de Classes em GoiásScript ===");

// Classe base de comidas goianas
arruma_trem ComidaGoiana {
    // Propriedades
    nome = "Sem nome";
    preco = 0;
    ingredientes = [];
    
    // Construtor goiano
    aprepara_trem(nome, preco) {
        ocê.nome é nome;
        ocê.preco é preco;
        ocê.ingredientes é [];
        ocê.preparado é de_jeito_nenhum;
        
        prosa("Apreparo da comida '" + ocê.nome + "' começou!");
    }
    
    // Método para adicionar ingredientes
    mexe_assim adiciona(ingrediente) {
        ocê.ingredientes.push(ingrediente);
        prosa("Adicionou " + ingrediente + " no " + ocê.nome);
        faz_favor ocê;
    }
    
    // Método para preparação
    mexe_assim preparar() {
        prosa("Preparando " + ocê.nome + " com " + ocê.ingredientes.length + " ingredientes...");
        ocê.preparado é certeza;
        faz_favor ocê;
    }
    
    // Método para mostrar detalhes
    mexe_assim mostraTrem() {
        prosa("--- " + ocê.nome + " ---");
        prosa("Preço: R$" + ocê.preco);
        prosa("Ingredientes:");
        
        vai_indo (trem i é 0; i menor_que ocê.ingredientes.length; i é i mais 1) {
            prosa("  - " + ocê.ingredientes[i]);
        }
        
        prosa("Está preparado? " + (ocê.preparado ? "Sim!" : "Ainda não!"));
        faz_favor ocê;
    }
    
    // Método estático para criar uma comida rápida
    num_muda mexe_assim feitoNaHora(tipo) {
        prosa("Fazendo " + tipo + " rapidim!");
        faz_favor faz_um ComidaGoiana(tipo, 5);
    }
}

// Classe que herda de ComidaGoiana
arruma_trem Pamonha inherda_de ComidaGoiana {
    // Propriedades adicionais
    tipo = "doce";
    
    // Construtor específico
    aprepara_trem(nome, preco, tipo) {
        // Chama o construtor da classe pai
        super(nome, preco);
        ocê.tipo é tipo || "doce";
        ocê.emPalha é certeza;
        
        // Já adiciona os ingredientes básicos
        ocê.adiciona("milho verde")
           .adiciona("açúcar")
           .adiciona("leite");
           
        se_ocê_quiser (tipo é_igualim "salgada") {
            ocê.adiciona("sal");
        } se_num_for (tipo é_igualim "com queijo") {
            ocê.adiciona("queijo");
        }
    }
    
    // Método que retorna uma pamonha especial
    mexe_assim getTremBão() {
        // Chama o método protegido da classe pai
        ocê.preparar();
        
        prosa("Pegando uma pamonha especial tipo " + ocê.tipo);
        
        uai pamonha é {
            nome: ocê.nome,
            tipo: ocê.tipo,
            sabor: ocê.tipo é_igualim "doce" ? "doce de milho" : "salgada de milho",
            quente: certeza,
            emPalha: ocê.emPalha
        };
        
        prosa("Trem bão demais da conta tá pronto!");
        faz_favor pamonha;
    }
    
    // Sobrescrita do método da classe pai
    mexe_assim mostraTrem() {
        // Chama o método da classe pai
        super.mostraTrem();
        prosa("Tipo: " + ocê.tipo);
        prosa("Embalado em palha? " + (ocê.emPalha ? "É, uai!" : "Não."));
        faz_favor ocê;
    }
}

// Testando a herança de classes
prosa("\n=== Testando ComidaGoiana ===");
uai comida é faz_um ComidaGoiana("Angu", 12.50);
comida.adiciona("fubá")
      .adiciona("sal")
      .adiciona("água")
      .mostraTrem();

// Testando método estático
prosa("\n=== Testando Método Estático ===");
uai comidaRapida é ComidaGoiana.feitoNaHora("Pão de Queijo");
comidaRapida.adiciona("polvilho")
           .adiciona("queijo")
           .mostraTrem();

// Testando a classe Pamonha
prosa("\n=== Testando Pamonha ===");
uai minhaLoja é faz_um Pamonha("Pamonha da Vovó", 8.50, "com queijo");
minhaLoja.mostraTrem();

// Obtendo uma pamonha especial
prosa("\n=== Pegando uma pamonha especial ===");
uai pamonhaEspecial é minhaLoja.getTremBão();

// Mostrando os detalhes da pamonha especial
prosa("\n=== Detalhes da pamonha especial ===");
prosa("Nome: " + pamonhaEspecial.nome);
prosa("Tipo: " + pamonhaEspecial.tipo);
prosa("Sabor: " + pamonhaEspecial.sabor);
prosa("Está quente? " + (pamonhaEspecial.quente ? "Sim, uai!" : "Não"));
prosa("Embalada em palha? " + (pamonhaEspecial.emPalha ? "É, uai!" : "Não"));