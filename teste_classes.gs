// Teste de classes em GoiásScript usando funções construtoras
prosa("=== Teste de Classes em GoiásScript ===");

// Função construtora para ComidaGoiana
presta_serviço ComidaGoiana(nome, preco) {
    // Criando o objeto
    uai self é {};
    
    // Propriedades
    self.nome é nome || "Sem nome";
    self.preco é preco || 0;
    self.ingredientes é [];
    self.preparado é de_jeito_nenhum;
    
    prosa("Apreparo da comida '" + self.nome + "' começou!");
    
    // Método para adicionar ingredientes
    self.adiciona é presta_serviço(ingrediente) {
        self.ingredientes.push(ingrediente);
        prosa("Adicionou " + ingrediente + " no " + self.nome);
        faz_favor self;
    };
    
    // Método para preparação
    self.preparar é presta_serviço() {
        prosa("Preparando " + self.nome + " com " + self.ingredientes.length + " ingredientes...");
        self.preparado é certeza;
        faz_favor self;
    };
    
    // Método para mostrar detalhes
    self.mostraTrem é presta_serviço() {
        prosa("--- " + self.nome + " ---");
        prosa("Preço: R$" + self.preco);
        prosa("Ingredientes:");
        
        vai_indo (trem i é 0; i menor_que self.ingredientes.length; i é i mais 1) {
            prosa("  - " + self.ingredientes[i]);
        }
        
        prosa("Está preparado? " + (self.preparado ? "Sim!" : "Ainda não!"));
        faz_favor self;
    };
    
    // Retornar o objeto criado
    faz_favor self;
}

// Método estático simulado
ComidaGoiana.feitoNaHora é presta_serviço(tipo) {
    prosa("Fazendo " + tipo + " rapidim!");
    faz_favor ComidaGoiana(tipo, 5);
};

// Função construtora para Pamonha (simula herança de ComidaGoiana)
presta_serviço Pamonha(nome, preco, tipo) {
    // Criar uma comida goiana base (simula super)
    uai self é ComidaGoiana(nome, preco);
    
    // Propriedades adicionais
    self.tipo é tipo || "doce";
    self.emPalha é certeza;
    
    // Já adiciona os ingredientes básicos
    self.adiciona("milho verde")
       .adiciona("açúcar")
       .adiciona("leite");
       
    se_ocê_quiser (tipo é_igualim "salgada") {
        self.adiciona("sal");
    } se_num_for (tipo é_igualim "com queijo") {
        self.adiciona("queijo");
    }
    
    // Salvar método original para simular super.mostraTrem()
    uai mostraTremOriginal é self.mostraTrem;
    
    // Método que retorna uma pamonha especial
    self.getTremBão é presta_serviço() {
        // Chama o método da classe pai
        self.preparar();
        
        prosa("Pegando uma pamonha especial tipo " + self.tipo);
        
        uai pamonha é {
            nome: self.nome,
            tipo: self.tipo,
            sabor: self.tipo é_igualim "doce" ? "doce de milho" : "salgada de milho",
            quente: certeza,
            emPalha: self.emPalha
        };
        
        prosa("Trem bão demais da conta tá pronto!");
        faz_favor pamonha;
    };
    
    // Sobrescrita do método mostraTrem
    self.mostraTrem é presta_serviço() {
        // Chama o método da classe pai (simulação de super.mostraTrem())
        mostraTremOriginal.call(self);
        
        prosa("Tipo: " + self.tipo);
        prosa("Embalado em palha? " + (self.emPalha ? "É, uai!" : "Não."));
        faz_favor self;
    };
    
    // Retorna o objeto criado
    faz_favor self;
}

// Testando a "herança" de classes
prosa("\n=== Testando ComidaGoiana ===");
uai comida é ComidaGoiana("Angu", 12.50);
comida.adiciona("fubá")
      .adiciona("sal")
      .adiciona("água")
      .mostraTrem();

// Testando método "estático"
prosa("\n=== Testando Método Estático ===");
uai comidaRapida é ComidaGoiana.feitoNaHora("Pão de Queijo");
comidaRapida.adiciona("polvilho")
           .adiciona("queijo")
           .mostraTrem();

// Testando a classe Pamonha
prosa("\n=== Testando Pamonha ===");
uai minhaLoja é Pamonha("Pamonha da Vovó", 8.50, "com queijo");
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