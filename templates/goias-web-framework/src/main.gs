// 🇧🇷 GoiásScript Framework - Aplicação Principal
// Inspirado no NestJS/Angular, mas 100% goiano!

pega "@goiano/core" em { GoiasApp, criarModulo }
pega "@goiano/web" em { criarComponente, criarRota }
pega "./app.module" em { AppModule }

// 🚀 Função principal da aplicação
vai_na_frente faz_trem bootstrap() {
  trem app = GoiasApp.criar(AppModule);

  // Configurações da aplicação
  app.configurar({
    porta: 3000,
    cors: certeza,
    hotReload: certeza,
    estaticos: "./public"
  });

  // Middleware global goiano
  app.usarMiddleware("logger", faz_trem(req, res, proximo) {
    uai agora = faz_um Date();
    prosa(`[${agora.toISOString()}] ${req.method} ${req.url}`);
    proximo();
  });

  // Iniciar servidor
  espera_um_cadim app.escutar();
  prosa("🎉 Aplicação GoiásScript rodando!");
}

// Auto-inicializar se estiver no browser
se (typeof window diferente_de "undefined") {
  // Modo frontend
  iniciarApp({
    routing: certeza,
    components: certeza
  });
} senao {
  // Modo backend
  bootstrap();
}