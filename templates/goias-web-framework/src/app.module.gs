// 🇧🇷 Módulo Principal da Aplicação GoiásScript
// Estrutura modular inspirada no NestJS

pega "@goiano/core" em { criarModulo, Modulo }
pega "@goiano/web" em { ControllerModule }
pega "./controllers/app.controller" em { AppController }
pega "./controllers/home.controller" em { HomeController }
pega "./services/app.service" em { AppService }
pega "./services/dados.service" em { DadosService }

@Modulo({
  controladores: [AppController, HomeController],
  servicos: [AppService, DadosService],
  modulos: [ControllerModule],
  exportar: [AppService]
})
arruma_trem AppModule {
  aprepara_trem() {
    prosa("🏗️ AppModule inicializado!");
  }
}

troca_ideia { AppModule };