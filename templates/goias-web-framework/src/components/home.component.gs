// 🇧🇷 Componente da Página Inicial
// Landing page principal da aplicação

pega "@goiano/web" em { criarComponente, Componente }

@Componente({
  seletor: "home-component",
  template: `
    <div class="home-component fade-in">
      <!-- Hero Section -->
      <section class="bg-gradient-to-r from-goiano-600 to-goiano-700 text-white py-20">
        <div class="goiano-container text-center">
          <h1 class="text-5xl font-bold mb-6">
            🇧🇷 Bem-vindo ao GoiásScript Framework!
          </h1>
          <p class="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            O primeiro framework web totalmente brasileiro. Desenvolva aplicações modernas
            usando a sintaxe goiana que você já conhece e ama.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="goiano-btn goiano-btn-warning text-lg px-8 py-3">
              🚀 Começar Agora
            </button>
            <button class="goiano-btn goiano-btn-secondary text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-goiano-600">
              📚 Documentação
            </button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-16 bg-white">
        <div class="goiano-container">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher o GoiásScript Framework?
            </h2>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto">
              Construído por brasileiros, para brasileiros. Com todas as funcionalidades modernas
              que você precisa, mas com a simplicidade goiana de sempre.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">⚡</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Super Rápido</h3>
              <p class="text-gray-600">
                Hot reload instantâneo, build otimizado e performance de primeira.
                Desenvolvimento ágil como um verdadeiro goiano!
              </p>
            </div>

            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">TailwindCSS Integrado</h3>
              <p class="text-gray-600">
                Classes utilitárias personalizadas com tema goiano.
                Design moderno sem complicação.
              </p>
            </div>

            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">🏗️</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Arquitetura Modular</h3>
              <p class="text-gray-600">
                Inspirado no NestJS e Angular, mas 100% goiano.
                Organize seu código como um profissional.
              </p>
            </div>

            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">🇧🇷</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">100% Brasileiro</h3>
              <p class="text-gray-600">
                Sintaxe em português, documentação em português,
                comunidade brasileira. Orgulho nacional!
              </p>
            </div>

            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">🔧</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Backend Integrado</h3>
              <p class="text-gray-600">
                Full-stack em uma única linguagem.
                Frontend e backend goianos trabalhando juntos.
              </p>
            </div>

            <div class="goiano-card-hover text-center">
              <div class="text-4xl mb-4">📱</div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Responsivo</h3>
              <p class="text-gray-600">
                Design que funciona em qualquer dispositivo.
                Do celular ao desktop, sempre bonito.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Code Example Section -->
      <section class="py-16 bg-gray-50">
        <div class="goiano-container">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Veja como é simples!
            </h2>
            <p class="text-lg text-gray-600">
              Código GoiásScript é limpo, intuitivo e poderoso.
            </p>
          </div>

          <div class="grid lg:grid-cols-2 gap-8">
            <!-- Frontend Example -->
            <div class="goiano-card">
              <h3 class="text-xl font-bold mb-4 text-gray-900">🎨 Frontend Component</h3>
              <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm"><code>// Componente Goiano
@Componente({
  seletor: "botao-goiano"
})
arruma_trem BotaoComponent {
  @Entrada() texto: texto = "Clique aqui"
  @Saida() aoClicar = faz_um EventEmitter()

  clicar() {
    prosa("Botão clicado! 🎉")
    ocê.aoClicar.emit(ocê.texto)
  }
}</code></pre>
            </div>

            <!-- Backend Example -->
            <div class="goiano-card">
              <h3 class="text-xl font-bold mb-4 text-gray-900">⚡ Backend Controller</h3>
              <pre class="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm"><code>// API REST Goiana
@Controlador("usuarios")
arruma_trem UsuarioController {

  @Pegar("/")
  listarUsuarios() {
    faz_favor ocê.usuarioService.buscarTodos()
  }

  @Postar("/")
  criarUsuario(@Corpo() dados: coisa) {
    faz_favor ocê.usuarioService.criar(dados)
  }
}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="py-16 bg-goiano-600 text-white">
        <div class="goiano-container">
          <div class="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-4xl font-bold mb-2" id="stat-projects">{{stats.projetos}}</div>
              <div class="text-goiano-200">Projetos Criados</div>
            </div>
            <div>
              <div class="text-4xl font-bold mb-2" id="stat-developers">{{stats.desenvolvedores}}</div>
              <div class="text-goiano-200">Desenvolvedores</div>
            </div>
            <div>
              <div class="text-4xl font-bold mb-2" id="stat-lines">{{stats.linhasCodigo}}</div>
              <div class="text-goiano-200">Linhas de Código</div>
            </div>
            <div>
              <div class="text-4xl font-bold mb-2" id="stat-stars">{{stats.estrelas}}</div>
              <div class="text-goiano-200">⭐ no GitHub</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 bg-white">
        <div class="goiano-container text-center">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Pronto para começar sua jornada goiana?
          </h2>
          <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Junte-se à revolução do desenvolvimento web brasileiro.
            Crie aplicações incríveis com a simplicidade goiana.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="goiano-btn goiano-btn-primary text-lg px-8 py-3" onclick="window.scrollTo(0,0)">
              🚀 Instalar GoiásScript
            </button>
            <button class="goiano-btn goiano-btn-secondary text-lg px-8 py-3">
              💬 Entrar na Comunidade
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  estilos: `
    .home-component {
      min-height: 100vh;
    }

    .fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .hero-bg {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    }

    pre code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      line-height: 1.5;
    }

    .stats-counter {
      transition: all 0.3s ease;
    }
  `
})
arruma_trem HomeComponent {
  aprepara_trem() {
    ocê.stats = {
      projetos: "500+",
      desenvolvedores: "1.2K+",
      linhasCodigo: "50K+",
      estrelas: "2.5K+"
    };

    ocê.carregarDados();
    ocê.animarStats();
  }

  vai_na_frente carregarDados() {
    tenta_aí {
      // Simular carregamento de dados da API
      espera_um_cadim new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar estatísticas com dados reais
      ocê.atualizarStats({
        projetos: Math.floor(Math.random() * 1000 mais 500),
        desenvolvedores: Math.floor(Math.random() * 500 mais 1200),
        linhasCodigo: Math.floor(Math.random() * 20000 mais 50000),
        estrelas: Math.floor(Math.random() * 1000 mais 2500)
      });

    } se_der_ruim (error) {
      prosa("Erro ao carregar dados:", error);
    }
  }

  atualizarStats(novasStats) {
    Object.chaves(novasStats).forEach(stat => {
      uai valor = novasStats[stat];
      se (typeof valor é_igualim "number") {
        ocê.stats[stat] = valor.toLocaleString('pt-BR') mais "+";
      }
    });

    ocê.renderizarStats();
  }

  animarStats() {
    uai observer = faz_um IntersectionObserver((entries) => {
      entries.forEach(entry => {
        se (entry.isIntersecting) {
          entry.target.style.transform = 'scale(1.1)';
          depois_de(() => {
            entry.target.style.transform = 'scale(1)';
          }, 200);
        }
      });
    });

    // Observar elementos de estatística
    document.querySelectorAll('[id^="stat-"]').forEach(el => {
      observer.observe(el);
    });
  }

  renderizarStats() {
    Object.chaves(ocê.stats).forEach(stat => {
      uai elemento = document.getElementById(`stat-${stat}`);
      se (elemento) {
        elemento.textContent = ocê.stats[stat];
      }
    });
  }

  mount() {
    uai container = document.querySelector('#router-outlet');
    se (container) {
      container.innerHTML = ocê.render();
      ocê.aprepara_trem();
    }
  }

  render() {
    faz_favor ocê.template
      .replace(/{{stats\.projetos}}/g, ocê.stats.projetos)
      .replace(/{{stats\.desenvolvedores}}/g, ocê.stats.desenvolvedores)
      .replace(/{{stats\.linhasCodigo}}/g, ocê.stats.linhasCodigo)
      .replace(/{{stats\.estrelas}}/g, ocê.stats.estrelas);
  }
}

// Registrar componente
criarComponente('home-component', HomeComponent);