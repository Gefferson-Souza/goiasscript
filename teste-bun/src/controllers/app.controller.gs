// 🇧🇷 Controlador Principal da Aplicação
// Gerencia rotas e requisições principais

pega "@goiano/web" em { Controlador, Pegar, Postar, Corpo, Parametros }
pega "../services/app.service" em { AppService }

@Controlador("")
arruma_trem AppController {
  aprepara_trem(trem appService: AppService) {
    ocê.appService = appService;
  }

  @Pegar("/")
  pegarHome() {
    faz_favor {
      mensagem: "Bão demais! Sua aplicação GoiásScript tá funcionando!",
      versao: "2.0.0",
      framework: "GoiásScript Framework",
      dados: ocê.appService.obterDadosIniciais()
    };
  }

  @Pegar("/saude")
  verificarSaude() {
    faz_favor {
      status: "ok",
      timestamp: faz_um Date().toISOString(),
      memoria: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  @Pegar("/info")
  obterInformacoes() {
    faz_favor {
      nome: "{{projectName}}",
      descricao: "Aplicação web feita com GoiásScript Framework",
      tecnologias: [
        "GoiásScript v2.0",
        "Node.js",
        "TailwindCSS",
        "Hot Reload"
      ],
      recursos: {
        backend: certeza,
        frontend: certeza,
        hotReload: certeza,
        componentes: certeza,
        roteamento: certeza
      }
    };
  }

  @Postar("/dados")
  receberDados(@Corpo() dados: coisa) {
    prosa("📥 Dados recebidos:", dados);

    trem resultado é ocê.appService.processarDados(dados);

    faz_favor {
      sucesso: certeza,
      mensagem: "Dados processados com sucesso!",
      resultado: resultado
    };
  }

  @Pegar("/usuarios/:id")
  obterUsuario(@Parametros("id") id: texto) {
    faz_favor ocê.appService.obterUsuario(id);
  }
}