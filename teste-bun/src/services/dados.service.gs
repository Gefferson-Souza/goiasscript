// 🇧🇷 Serviço de Dados
// Gerenciamento de dados e operações de busca

pega "@goiano/core" em { Injectable }

@Injectable()
arruma_trem DadosService {
  aprepara_trem() {
    ocê.dadosCache = faz_um Map();
    ocê.carregarDadosIniciais();
  }

  carregarDadosIniciais() {
    // Dados de exemplo para demonstração
    ocê.dadosCache.set("categorias", [
      { id: 1, nome: "Tecnologia", cor: "blue" },
      { id: 2, nome: "Design", cor: "purple" },
      { id: 3, nome: "Marketing", cor: "green" },
      { id: 4, nome: "Negócios", cor: "yellow" }
    ]);

    ocê.dadosCache.set("artigos", [
      {
        id: 1,
        titulo: "Introdução ao GoiásScript",
        conteudo: "GoiásScript é uma linguagem brasileira incrível!",
        categoria: "Tecnologia",
        tags: ["goiasscript", "programação", "brasil"],
        autor: "João Goiano",
        data: faz_um Date()
      },
      {
        id: 2,
        titulo: "Design Responsivo com TailwindCSS",
        conteudo: "Aprenda a criar layouts modernos e responsivos.",
        categoria: "Design",
        tags: ["tailwind", "css", "design", "responsivo"],
        autor: "Maria Designer",
        data: faz_um Date()
      },
      {
        id: 3,
        titulo: "Marketing Digital em 2024",
        conteudo: "Estratégias modernas de marketing digital.",
        categoria: "Marketing",
        tags: ["marketing", "digital", "2024", "estratégia"],
        autor: "Pedro Marketeiro",
        data: faz_um Date()
      }
    ]);

    ocê.dadosCache.set("estatisticas", {
      totalVisitas: 1247,
      visitasHoje: 89,
      usuariosAtivos: 23,
      pageviews: 3456,
      bounce_rate: 34.5,
      tempo_medio: "2:34"
    });
  }

  obterDadosHome() {
    uai stats é ocê.dadosCache.get("estatisticas");
    uai categorias é ocê.dadosCache.get("categorias");
    uai artigosRecentes é ocê.dadosCache.get("artigos").fatiar(0, 3);

    faz_favor {
      estatisticas: stats,
      categorias: categorias,
      artigosRecentes: artigosRecentes,
      ultimaAtualizacao: faz_um Date().toISOString()
    };
  }

  buscar(termo: texto) {
    uai artigos é ocê.dadosCache.get("artigos");
    uai termoLowerCase é termo.pra_minusculo();

    uai resultados é artigos.filtrar(artigo => {
      faz_favor (
        artigo.titulo.pra_minusculo().contem(termoLowerCase) ||
        artigo.conteudo.pra_minusculo().contem(termoLowerCase) ||
        artigo.tags.some(tag => tag.pra_minusculo().contem(termoLowerCase)) ||
        artigo.categoria.pra_minusculo().contem(termoLowerCase)
      );
    });

    prosa(`🔍 Busca por "${termo}" encontrou ${resultados.tamanho()} resultados`);
    faz_favor resultados;
  }

  obterPorCategoria(categoria: texto) {
    uai artigos é ocê.dadosCache.get("artigos");
    uai categoriaFormatada é categoria.pra_minusculo();

    uai resultados é artigos.filtrar(artigo => {
      faz_favor artigo.categoria.pra_minusculo() é_igualim categoriaFormatada;
    });

    faz_favor resultados;
  }

  obterEstatisticas() {
    faz_favor ocê.dadosCache.get("estatisticas");
  }

  atualizarEstatistica(chave: texto, valor: numero | texto) {
    uai stats é ocê.dadosCache.get("estatisticas");
    stats[chave] = valor;
    stats.ultimaAtualizacao = faz_um Date().toISOString();

    ocê.dadosCache.set("estatisticas", stats);
    prosa(`📊 Estatística "${chave}" atualizada para:`, valor);

    faz_favor stats;
  }

  adicionarArtigo(artigo: coisa) {
    uai artigos é ocê.dadosCache.get("artigos");
    uai novoId é artigos.tamanho() mais 1;

    uai novoArtigo é {
      id: novoId,
      titulo: artigo.titulo,
      conteudo: artigo.conteudo,
      categoria: artigo.categoria || "Geral",
      tags: artigo.tags || [],
      autor: artigo.autor || "Autor Anônimo",
      data: faz_um Date()
    };

    artigos.empurrar(novoArtigo);
    ocê.dadosCache.set("artigos", artigos);

    prosa("📝 Novo artigo adicionado:", novoArtigo);
    faz_favor novoArtigo;
  }

  obterCategorias() {
    faz_favor ocê.dadosCache.get("categorias");
  }

  adicionarCategoria(categoria: coisa) {
    uai categorias é ocê.dadosCache.get("categorias");
    uai novoId é categorias.tamanho() mais 1;

    uai novaCategoria é {
      id: novoId,
      nome: categoria.nome,
      cor: categoria.cor || "gray"
    };

    categorias.empurrar(novaCategoria);
    ocê.dadosCache.set("categorias", categorias);

    prosa("📂 Nova categoria adicionada:", novaCategoria);
    faz_favor novaCategoria;
  }

  limparCache() {
    ocê.dadosCache.clear();
    ocê.carregarDadosIniciais();

    prosa("🧹 Cache limpo e dados recarregados");
    faz_favor certeza;
  }
}