// Exemplo usando padrão de objeto e protótipo em GoiásScript
prosa("=== Exemplo de Objetos em GoiásScript ===");

// Função construtora para Pamonharia
presta_serviço Pamonharia(nome, preco) {
    // Criando e configurando o objeto
    uai self é {};
    self.nome é nome || "Pamonha sem nome";
    self.preco é preco || 5.00;
    self.ingredientes é ["milho verde", "açúcar", "leite"];
    
    // Método para obter detalhes da pamonha
    self.detalhes é presta_serviço() {
        prosa("Pamonha: " mais self.nome);
        prosa("Preço: R$" mais self.preco);
        prosa("Ingredientes:");
        
        vai_indo (trem i é 0; i menor_que self.ingredientes.length; i é i mais 1) {
            prosa("- " mais self.ingredientes[i]);
        }
        
        faz_favor self;
    };
    
    // Método para obter um trem bão (uma pamonha especial)
    self.getTremBão é presta_serviço() {
        prosa("Preparando uma pamonha especial...");
        
        uai pamonhaEspecial é {
            tipo: "Pamonha Goiana",
            sabor: "doce de milho cremoso",
            quente: certeza,
            ingredienteSecreto: "canela"
        };
        
        prosa("Trem bão demais da conta tá pronto!");
        faz_favor pamonhaEspecial;
    };
    
    // Método para adicionar ingredientes
    self.adicionarIngrediente é presta_serviço(ingrediente) {
        self.ingredientes.push(ingrediente);
        prosa("Ingrediente adicionado: " mais ingrediente);
        faz_favor self;
    };
    
    // Retornando o objeto criado
    faz_favor self;
}

// Criando uma instância da pamonharia
prosa("\nCriando uma pamonharia...");
uai minhaLoja é Pamonharia("Pamonha da Vovó", 8.50);

// Usando os métodos
minhaLoja.detalhes();

// Adicionando novos ingredientes
prosa("\nAdicionando ingredientes especiais:");
minhaLoja.adicionarIngrediente("queijo");
minhaLoja.adicionarIngrediente("coco");

// Mostrando detalhes atualizados
prosa("\nDetalhes atualizados:");
minhaLoja.detalhes();

// Obtendo uma pamonha especial
prosa("\nVamos pegar um trem bão:");
uai pamonhaEspecial é minhaLoja.getTremBão();

// Mostrando detalhes da pamonha especial
prosa("\nDetalhes da pamonha especial:");
prosa("Tipo: " mais pamonhaEspecial.tipo);
prosa("Sabor: " mais pamonhaEspecial.sabor);
prosa("Está quente? " mais (pamonhaEspecial.quente ? "Sim, uai!" : "Não"));
prosa("Ingrediente secreto: " mais pamonhaEspecial.ingredienteSecreto);