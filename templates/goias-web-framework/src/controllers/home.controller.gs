// 🇧🇷 Controlador da Página Inicial
// Gerencia requisições da home page

pega "@goiano/web" em { Controlador, Pegar, Parametros, Query }
pega "../services/dados.service" em { DadosService }

@Controlador("home")
arruma_trem HomeController {
  aprepara_trem(trem dadosService: DadosService) {
    ocê.dadosService = dadosService;
  }

  @Pegar("/")
  exibirHome() {
    trem dadosHome = ocê.dadosService.obterDadosHome();

    faz_favor {
      titulo: "Bem-vindo ao GoiásScript Framework!",
      descricao: "Framework web brasileiro feito por goianos, para goianos!",
      recursos: [
        {
          nome: "🚀 Hot Reload",
          descricao: "Desenvolvimento ágil com recarregamento automático"
        },
        {
          nome: "🎨 TailwindCSS",
          descricao: "Estilização moderna e responsiva"
        },
        {
          nome: "⚡ Performance",
          descricao: "Otimizado para velocidade e eficiência"
        },
        {
          nome: "🇧🇷 100% Goiano",
          descricao: "Sintaxe familiar em português brasileiro"
        }
      ],
      stats: dadosHome
    };
  }

  @Pegar("/exemplos")
  listarExemplos() {
    faz_favor {
      exemplos: [
        {
          nome: "Todo App Goiano",
          codigo: "// Criar lista de tarefas goiana\\nuai tarefas = [];\\nfaz_trem adicionarTarefa(texto) {\\n  tarefas.empurrar(texto);\\n}"
        },
        {
          nome: "API REST Goiana",
          codigo: "@Pegar('/usuarios')\\nfaz_trem listarUsuarios() {\\n  faz_favor usuarios.filtrar(u => u.ativo);\\n}"
        },
        {
          nome: "Componente Goiano",
          codigo: "criarComponente('botao-goiano', {\\n  template: '<button class=\"goiano-btn-primary\">{{texto}}</button>'\\n});"
        }
      ]
    };
  }

  @Pegar("/buscar")
  buscar(@Query("termo") termo: texto) {
    se (num termo) {
      faz_favor {
        erro: "Termo de busca é obrigatório",
        exemplo: "/home/buscar?termo=goias"
      };
    }

    trem resultados = ocê.dadosService.buscar(termo);

    faz_favor {
      termo: termo,
      total: resultados.tamanho(),
      resultados: resultados
    };
  }

  @Pegar("/categoria/:categoria")
  obterPorCategoria(@Parametros("categoria") categoria: texto) {
    trem dados = ocê.dadosService.obterPorCategoria(categoria);

    faz_favor {
      categoria: categoria,
      itens: dados,
      total: dados.tamanho()
    };
  }
}