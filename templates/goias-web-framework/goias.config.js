/**
 * 🇧🇷 Configuração do GoiásScript Framework
 * Arquivo de configuração principal para aplicações GoiásScript
 */

module.exports = {
  // Informações do projeto
  projeto: {
    nome: "{{projectName}}",
    versao: "1.0.0",
    descricao: "Aplicação web feita com GoiásScript Framework",
    autor: "Desenvolvedor Goiano"
  },

  // Configurações de build
  build: {
    // Arquivo de entrada principal
    entrada: "./src/main.gs",

    // Pasta de saída
    saida: "./dist",

    // Pasta de arquivos públicos
    publicos: "./public",

    // Arquivos a serem observados para rebuild
    observar: [
      "src/**/*.gs",
      "public/**/*",
      "*.config.js"
    ],

    // Minificar código em produção
    minificar: process.env.NODE_ENV === 'production',

    // Gerar source maps
    sourceMaps: process.env.NODE_ENV === 'development',

    // Limpeza automática da pasta de saída
    limparSaida: true
  },

  // Funcionalidades do framework
  funcionalidades: {
    // Hot reload para desenvolvimento
    hotReload: true,

    // TailwindCSS integrado
    tailwindCSS: true,

    // Sistema de componentes
    componentes: true,

    // Roteamento SPA
    roteamento: true,

    // Backend integrado
    backend: true,

    // PWA (Progressive Web App)
    pwa: false,

    // TypeScript (futuro)
    typescript: false
  },

  // Configurações do servidor de desenvolvimento
  devServer: {
    porta: 3000,
    host: "localhost",
    https: false,
    abriNoNavegador: true,
    proxy: {
      "/api": "http://localhost:3001"
    }
  },

  // Configurações do servidor backend
  backend: {
    porta: 3001,
    cors: true,
    middleware: [
      "express.json()",
      "express.urlencoded({ extended: true })"
    ],
    rotas: {
      prefixo: "/api",
      versao: "v1"
    }
  },

  // Configurações do TailwindCSS
  tailwind: {
    // Arquivo de configuração personalizado
    config: "./tailwind.config.js",

    // CSS de entrada
    entrada: "./src/styles/main.css",

    // CSS de saída
    saida: "./dist/styles.css",

    // Purge CSS em produção
    purge: process.env.NODE_ENV === 'production',

    // Classes utilitárias personalizadas
    utilidades: {
      // Componentes goianos pré-definidos
      goianoComponents: true,

      // Animações goianas
      goianoAnimations: true,

      // Grid responsivo goiano
      goianoGrid: true
    }
  },

  // Configurações de componentes
  componentes: {
    // Pasta dos componentes
    pasta: "./src/components",

    // Prefixo para componentes personalizados
    prefixo: "app",

    // Auto-registro de componentes
    autoRegistro: true,

    // Componentes globais
    globais: [
      "app-header",
      "app-footer",
      "app-loading"
    ]
  },

  // Configurações de roteamento
  roteamento: {
    // Modo de roteamento (hash ou history)
    modo: "history",

    // Rota base
    base: "/",

    // Rotas automáticas baseadas em arquivos
    rotasAutomaticas: true,

    // Middleware de rota
    middleware: []
  },

  // Configurações de assets
  assets: {
    // Pasta de imagens
    imagens: "./public/images",

    // Pasta de fontes
    fontes: "./public/fonts",

    // Otimização de imagens
    otimizarImagens: true,

    // Favicon
    favicon: "./public/favicon.ico",

    // Manifest para PWA
    manifest: "./public/manifest.json"
  },

  // Configurações de SEO
  seo: {
    // Meta tags padrão
    metaTags: {
      charset: "UTF-8",
      viewport: "width=device-width, initial-scale=1.0",
      description: "Aplicação web feita com GoiásScript Framework",
      keywords: "goiasscript, web, framework, brasileiro",
      author: "Desenvolvedor Goiano"
    },

    // Open Graph
    openGraph: {
      title: "{{projectName}} - GoiásScript",
      description: "Aplicação web brasileira feita com GoiásScript",
      type: "website",
      locale: "pt_BR"
    }
  },

  // Plugins personalizados
  plugins: [
    // Plugin de otimização
    {
      nome: "otimizacao",
      opcoes: {
        minificarHTML: true,
        minificarCSS: true,
        minificarJS: true,
        otimizarImagens: true
      }
    },

    // Plugin de análise de bundle
    {
      nome: "analise-bundle",
      opcoes: {
        ativo: process.env.ANALISE_BUNDLE === 'true',
        arquivo: "./dist/bundle-report.html"
      }
    }
  ],

  // Variáveis de ambiente
  env: {
    // Variáveis públicas (acessíveis no frontend)
    publicas: {
      GOIAS_APP_NAME: "{{projectName}}",
      GOIAS_APP_VERSION: "1.0.0",
      GOIAS_FRAMEWORK_VERSION: "2.0.0"
    },

    // Variáveis privadas (apenas backend)
    privadas: {
      DATABASE_URL: process.env.DATABASE_URL,
      SECRET_KEY: process.env.SECRET_KEY
    }
  },

  // Configurações de teste (futuro)
  testes: {
    framework: "jest",
    pasta: "./tests",
    cobertura: true,
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },

  // Configurações de deploy
  deploy: {
    // Provedor (netlify, vercel, github-pages, etc.)
    provedor: "netlify",

    // Pasta de build para deploy
    pasta: "./dist",

    // Scripts pré-deploy
    preScript: "npm run build",

    // Configurações específicas por ambiente
    ambientes: {
      desenvolvimento: {
        url: "http://localhost:3000"
      },
      producao: {
        url: "https://meu-app-goiano.netlify.app"
      }
    }
  }
};