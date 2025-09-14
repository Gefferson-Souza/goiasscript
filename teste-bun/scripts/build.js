#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇧🇷 GoiásScript Build System
 * Sistema de build moderno para aplicações GoiásScript
 */
class GoiasBuildSystem {
  constructor() {
    this.srcPath = path.resolve('./src');
    this.distPath = path.resolve('./dist');
    this.publicPath = path.resolve('./public');
    this.tempPath = path.resolve('./temp');
  }

  init() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      entry: './src/main.gs',
      output: './dist',
      features: {
        tailwindCSS: true,
        hotReload: true,
        components: true,
        backend: false,
        minify: false
      }
    };

    // Por enquanto usar configuração padrão
    // TODO: Implementar carregamento dinâmico de config em versão futura
    return defaultConfig;
  }

  async build() {
    console.log('🔧 Iniciando build do GoiásScript Framework...');

    // Inicializar configuração
    this.init();

    try {
      // 1. Limpar pasta dist
      await this.cleanDist();

      // 2. Criar estrutura de pastas
      await this.createDirectories();

      // 3. Compilar arquivos GoiásScript
      await this.compileGoiasScript();

      // 4. Processar TailwindCSS
      if (this.config.features.tailwindCSS) {
        await this.processTailwind();
      }

      // 5. Copiar assets estáticos
      await this.copyStaticAssets();

      // 6. Gerar HTML final
      await this.generateHTML();

      // 7. Bundle JavaScript (se necessário)
      await this.bundleJavaScript();

      console.log('✅ Build concluído com sucesso!');
      console.log(`📦 Output: ${this.distPath}`);

    } catch (error) {
      console.error('❌ Erro durante o build:', error.message);
      throw error;
    }
  }

  async cleanDist() {
    if (fs.existsSync(this.distPath)) {
      fs.rmSync(this.distPath, { recursive: true, force: true });
    }
    if (fs.existsSync(this.tempPath)) {
      fs.rmSync(this.tempPath, { recursive: true, force: true });
    }
  }

  async createDirectories() {
    [this.distPath, this.tempPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async compileGoiasScript() {
    console.log('📝 Compilando arquivos GoiásScript...');

    // Encontrar todos os arquivos .gs
    const gsFiles = this.findFiles(this.srcPath, '.gs');

    for (const file of gsFiles) {
      const relativePath = path.relative(this.srcPath, file);
      const outputPath = path.join(this.tempPath, relativePath.replace('.gs', '.js'));

      // Criar diretório de saída
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      // Compilar usando goiasscript
      try {
        const command = `goiasscript traduz "${file}"`;
        execSync(command, { stdio: 'pipe' });

        // Mover arquivo compilado
        const compiledFile = file.replace('.gs', '.js');
        if (fs.existsSync(compiledFile)) {
          fs.copyFileSync(compiledFile, outputPath);
          fs.unlinkSync(compiledFile); // Limpar arquivo temporário
        }

      } catch (error) {
        console.warn(`⚠️ Erro ao compilar ${relativePath}:`, error.message);
      }
    }
  }

  async processTailwind() {
    console.log('🎨 Processando TailwindCSS...');

    // Verificar se existe configuração do Tailwind
    const tailwindConfigPath = path.resolve('./tailwind.config.js');
    if (!fs.existsSync(tailwindConfigPath)) {
      await this.generateTailwindConfig();
    }

    // Criar CSS de entrada
    const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 🇧🇷 Estilos Goianos Personalizados */
.goiano-container {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
}

.goiano-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-100;
}

.goiano-btn {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm;
}

.goiano-btn-primary {
  @apply goiano-btn text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500;
}

.goiano-btn-secondary {
  @apply goiano-btn text-gray-700 bg-white hover:bg-gray-50 border-gray-300;
}
`;

    const inputPath = path.join(this.tempPath, 'input.css');
    fs.writeFileSync(inputPath, inputCSS);

    // Executar Tailwind
    try {
      const outputPath = path.join(this.distPath, 'styles.css');
      const command = `npx tailwindcss -i "${inputPath}" -o "${outputPath}" --minify`;
      execSync(command, { stdio: 'pipe' });
    } catch (error) {
      console.warn('⚠️ Erro ao processar TailwindCSS:', error.message);
    }
  }

  async generateTailwindConfig() {
    const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{gs,js,html}",
    "./public/**/*.html",
    "./dist/**/*.{js,html}"
  ],
  theme: {
    extend: {
      colors: {
        'goiano': {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        }
      },
      fontFamily: {
        'goiano': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}`;

    fs.writeFileSync('./tailwind.config.js', config);
  }

  async copyStaticAssets() {
    console.log('📁 Copiando assets estáticos...');

    if (fs.existsSync(this.publicPath)) {
      this.copyDirectory(this.publicPath, this.distPath);
    }
  }

  async generateHTML() {
    console.log('📄 Gerando HTML final...');

    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="goiano">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - GoiásScript Framework</title>
    <meta name="description" content="Aplicação web feita com GoiásScript Framework">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

    <!-- CSS -->
    <link rel="stylesheet" href="/styles.css">

    <!-- Meta tags para SEO -->
    <meta property="og:title" content="{{title}} - GoiásScript">
    <meta property="og:description" content="Aplicação web brasileira feita com GoiásScript">
    <meta property="og:type" content="website">

    <!-- PWA -->
    <meta name="theme-color" content="#16a34a">
    <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-gray-50 font-goiano">
    <!-- 🇧🇷 Aplicação GoiásScript -->
    <div id="app" class="min-h-screen">
        <div id="loading" class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-goiano-600 mx-auto"></div>
                <p class="mt-4 text-gray-600">Carregando aplicação GoiásScript...</p>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/main.js"></script>
    ${this.config.features.hotReload ? '<script src="/hot-reload.js"></script>' : ''}

    <script>
        // Remover loading quando app carregar
        window.addEventListener('load', () => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;

    // Buscar título do projeto
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const title = packageJson.name || 'Meu Projeto GoiásScript';

    const finalHTML = htmlTemplate.replace(/{{title}}/g, title);
    fs.writeFileSync(path.join(this.distPath, 'index.html'), finalHTML);
  }

  async bundleJavaScript() {
    console.log('📦 Fazendo bundle do JavaScript...');

    // Combinar todos os arquivos JS compilados
    const jsFiles = this.findFiles(this.tempPath, '.js');
    let combinedJS = '';

    // Adicionar runtime GoiásScript
    combinedJS += '// 🇧🇷 GoiásScript Runtime\\n';
    combinedJS += this.getGoiasRuntime();
    combinedJS += '\\n\\n';

    // Adicionar arquivos do projeto
    jsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.tempPath, file);
        combinedJS += `// File: ${relativePath}\\n`;
        combinedJS += content;
        combinedJS += '\\n\\n';
      }
    });

    fs.writeFileSync(path.join(this.distPath, 'main.js'), combinedJS);
  }

  getGoiasRuntime() {
    return `
// 🇧🇷 GoiásScript Framework Runtime
window.GoiasFramework = {
  version: '2.0.0',
  components: new Map(),
  services: new Map(),
  router: null,

  // Registrar componente
  component: function(name, definition) {
    this.components.set(name, definition);
  },

  // Registrar serviço
  service: function(name, definition) {
    this.services.set(name, definition);
  },

  // Bootstrap da aplicação
  bootstrap: function(config = {}) {
    console.log('🚀 Inicializando GoiásScript Framework v' + this.version);

    // Inicializar roteamento se habilitado
    if (config.routing) {
      this.initRouter();
    }

    // Carregar componentes
    this.loadComponents();

    console.log('✅ GoiásScript Framework carregado!');
  },

  initRouter: function() {
    // Sistema de roteamento simples
    this.router = {
      routes: new Map(),
      currentRoute: null,

      add: function(path, component) {
        this.routes.set(path, component);
      },

      navigate: function(path) {
        const component = this.routes.get(path);
        if (component && typeof component === 'function') {
          component();
        }
        this.currentRoute = path;
      }
    };
  },

  loadComponents: function() {
    // Auto-carregar componentes registrados
    this.components.forEach((definition, name) => {
      if (typeof definition.mount === 'function') {
        definition.mount();
      }
    });
  }
};

// Aliases goianos
window.criarComponente = (name, def) => GoiasFramework.component(name, def);
window.criarServico = (name, def) => GoiasFramework.service(name, def);
window.iniciarApp = (config) => GoiasFramework.bootstrap(config);
`;
  }

  findFiles(dir, extension) {
    const files = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (fullPath.endsWith(extension)) {
          files.push(fullPath);
        }
      });
    };

    scan(dir);
    return files;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
}

// Executar build se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new GoiasBuildSystem();
  builder.build().catch(error => {
    console.error('Build falhou:', error);
    process.exit(1);
  });
}

export default GoiasBuildSystem;