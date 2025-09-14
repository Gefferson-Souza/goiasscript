// 🇧🇷 Componente Principal da Aplicação
// Gerencia a interface principal e navegação

pega "@goiano/web" em { criarComponente, Componente }

@Componente({
  seletor: "app-goiano",
  template: `
    <div id="app-goiano" class="min-h-screen bg-gray-50">
      <!-- Header Goiano -->
      <header class="bg-goiano-600 text-white shadow-lg">
        <div class="goiano-container">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <h1 class="text-2xl font-bold">🇧🇷 {{titulo}}</h1>
              <span class="bg-goiano-500 px-2 py-1 rounded text-xs">v{{versao}}</span>
            </div>

            <nav class="hidden md:flex space-x-6">
              <a href="/" class="hover:text-goiano-200 transition-colors">Início</a>
              <a href="/sobre" class="hover:text-goiano-200 transition-colors">Sobre</a>
              <a href="/docs" class="hover:text-goiano-200 transition-colors">Documentação</a>
              <a href="/exemplos" class="hover:text-goiano-200 transition-colors">Exemplos</a>
            </nav>

            <button id="menu-toggle" class="md:hidden goiano-btn goiano-btn-secondary">
              ☰
            </button>
          </div>
        </div>
      </header>

      <!-- Menu Mobile -->
      <div id="mobile-menu" class="hidden bg-goiano-700 text-white">
        <div class="goiano-container py-4 space-y-2">
          <a href="/" class="block hover:text-goiano-200">Início</a>
          <a href="/sobre" class="block hover:text-goiano-200">Sobre</a>
          <a href="/docs" class="block hover:text-goiano-200">Documentação</a>
          <a href="/exemplos" class="block hover:text-goiano-200">Exemplos</a>
        </div>
      </div>

      <!-- Conteúdo Principal -->
      <main class="goiano-container py-8">
        <div id="router-outlet">
          <!-- Conteúdo das rotas será renderizado aqui -->
          <home-component></home-component>
        </div>
      </main>

      <!-- Footer Goiano -->
      <footer class="bg-gray-800 text-white mt-16">
        <div class="goiano-container py-8">
          <div class="grid md:grid-cols-3 gap-8">
            <div>
              <h3 class="text-lg font-bold mb-4">🇧🇷 GoiásScript Framework</h3>
              <p class="text-gray-300">
                Framework web brasileiro para desenvolvedores goianos.
                Feito com muito amor em Goiás! 💚
              </p>
            </div>

            <div>
              <h4 class="font-bold mb-4">Links Úteis</h4>
              <ul class="space-y-2 text-gray-300">
                <li><a href="/docs" class="hover:text-white transition-colors">📚 Documentação</a></li>
                <li><a href="/exemplos" class="hover:text-white transition-colors">💡 Exemplos</a></li>
                <li><a href="https://github.com/goiasscript" class="hover:text-white transition-colors">🐙 GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-bold mb-4">Tecnologias</h4>
              <div class="flex flex-wrap gap-2">
                <span class="bg-gray-700 px-2 py-1 rounded text-xs">GoiásScript</span>
                <span class="bg-gray-700 px-2 py-1 rounded text-xs">TailwindCSS</span>
                <span class="bg-gray-700 px-2 py-1 rounded text-xs">Node.js</span>
                <span class="bg-gray-700 px-2 py-1 rounded text-xs">Hot Reload</span>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400">
            <p>&copy; 2024 GoiásScript Framework. Feito com ❤️ em Goiás.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  estilos: `
    .app-goiano {
      font-family: 'Inter', system-ui, sans-serif;
    }

    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #16a34a;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
})
arruma_trem AppComponent {
  aprepara_trem() {
    ocê.titulo = "{{projectName}}";
    ocê.versao = "2.0.0";
    ocê.menuAberto = de_jeito_nenhum;

    ocê.configurarEventos();
    ocê.inicializarRoteamento();
  }

  configurarEventos() {
    // Toggle do menu mobile
    document.addEventListener('click', faz_trem(event) {
      uai target é event.target;

      se (target.id é_igualim 'menu-toggle') {
        ocê.toggleMenu();
      }
    });

    // Navegação SPA
    document.addEventListener('click', faz_trem(event) {
      uai target é event.target;

      se (target.tagName é_igualim 'A' e_mais target.href.startsWith(window.location.origin)) {
        event.preventDefault();
        uai rota é target.getAttribute('href');
        ocê.navegarPara(rota);
      }
    });

    // Responsividade
    window.addEventListener('resize', faz_trem() {
      se (window.innerWidth maior_que 768) {
        document.getElementById('mobile-menu').classList.add('hidden');
        ocê.menuAberto = de_jeito_nenhum;
      }
    });
  }

  toggleMenu() {
    uai menu é document.getElementById('mobile-menu');

    se (ocê.menuAberto) {
      menu.classList.add('hidden');
    } senao {
      menu.classList.remove('hidden');
    }

    ocê.menuAberto = num ocê.menuAberto;
  }

  inicializarRoteamento() {
    // Sistema de roteamento simples
    ocê.rotas é faz_um Map();
    ocê.rotas.set('/', 'home-component');
    ocê.rotas.set('/sobre', 'sobre-component');
    ocê.rotas.set('/docs', 'docs-component');
    ocê.rotas.set('/exemplos', 'exemplos-component');

    // Detectar mudanças na URL
    window.addEventListener('popstate', faz_trem() {
      ocê.renderizarRota(window.location.pathname);
    });

    // Renderizar rota inicial
    ocê.renderizarRota(window.location.pathname);
  }

  navegarPara(rota) {
    history.pushState(nada, '', rota);
    ocê.renderizarRota(rota);
  }

  renderizarRota(rota) {
    uai outlet é document.getElementById('router-outlet');
    uai componente é ocê.rotas.get(rota) || 'notfound-component';

    // Efeito de transição
    outlet.style.opacity = '0.5';

    depois_de(faz_trem() {
      outlet.innerHTML = `<${componente}></${componente}>`;
      outlet.style.opacity = '1';
    }, 150);

    prosa(`🧭 Navegando para: ${rota}`);
  }

  mount() {
    uai appContainer é document.getElementById('app');
    se (appContainer) {
      appContainer.innerHTML = ocê.render();
      ocê.aprepara_trem();
    }
  }

  render() {
    faz_favor ocê.template
      .replace(/{{titulo}}/g, ocê.titulo)
      .replace(/{{versao}}/g, ocê.versao);
  }
}

// Registrar componente globalmente
criarComponente('app-goiano', AppComponent);