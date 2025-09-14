# 🇧🇷 {{projectName}} - GoiásScript Framework

> **Aplicação web moderna feita com GoiásScript Framework v2.0**

Bem-vindo à sua nova aplicação GoiásScript! Este projeto foi criado com o **GoiásScript Framework**, o primeiro framework web totalmente brasileiro, inspirado no NestJS e Angular, mas com a simplicidade goiana que você já conhece.

## ✨ Características

- 🚀 **Hot Reload** - Desenvolvimento ágil com recarregamento automático
- 🎨 **TailwindCSS Integrado** - Classes utilitárias com tema goiano personalizado
- 🏗️ **Arquitetura Modular** - Sistema de componentes, serviços e controladores
- ⚡ **Full-Stack** - Frontend e backend em uma única linguagem
- 🇧🇷 **100% Brasileiro** - Sintaxe em português, feito por goianos
- 📱 **Responsivo** - Design que funciona em qualquer dispositivo

## 🚀 Começar Rapidamente

### Pré-requisitos

- Node.js 16+ instalado
- GoiásScript CLI instalado globalmente

### Instalação

```bash
# Clonar o template (já feito pelo CLI)
cd {{projectName}}

# Instalar dependências
npm install

# Instalar TailwindCSS
npm install -D tailwindcss autoprefixer postcss

# Inicializar TailwindCSS (se necessário)
npx tailwindcss init -p
```

### Comandos Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Servir aplicação em produção
npm run serve

# Observar mudanças e rebuild automático
npm run watch

# Iniciar aplicação completa (build + serve)
npm start

# Verificar sintaxe GoiásScript
npm run check

# Limpar pasta de build
npm run limpa

# Executar testes (futuro)
npm test
```

## 📁 Estrutura do Projeto

```
{{projectName}}/
├── src/                    # Código fonte GoiásScript
│   ├── components/         # Componentes da interface
│   │   ├── app.component.gs
│   │   └── home.component.gs
│   ├── controllers/        # Controladores de API (backend)
│   │   ├── app.controller.gs
│   │   └── home.controller.gs
│   ├── services/          # Serviços de negócio
│   │   ├── app.service.gs
│   │   └── dados.service.gs
│   ├── models/            # Modelos de dados
│   ├── config/            # Configurações
│   ├── app.module.gs      # Módulo principal
│   └── main.gs            # Ponto de entrada
├── dist/                  # Código compilado (auto-gerado)
├── public/                # Assets estáticos
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── scripts/               # Scripts de build personalizados
│   ├── dev-server.js      # Servidor de desenvolvimento
│   ├── build.js           # Sistema de build
│   └── watch.js           # Observer de arquivos
├── tailwind.config.js     # Configuração TailwindCSS
├── goias.config.js        # Configuração GoiásScript Framework
├── package.json
└── README.md
```

## 🎨 Sistema de Componentes

### Criando um Componente

```goiasscript
// src/components/meu-componente.gs
pega "@goiano/web" em { Componente, criarComponente }

@Componente({
  seletor: "meu-componente",
  template: `
    <div class="goiano-card">
      <h2 class="text-xl font-bold">{{titulo}}</h2>
      <p class="text-gray-600">{{descricao}}</p>
      <button class="goiano-btn goiano-btn-primary" onclick="{{aoClicar}}">
        Clique aqui
      </button>
    </div>
  `
})
arruma_trem MeuComponente {
  aprepara_trem() {
    ocê.titulo = "Meu Componente Goiano"
    ocê.descricao = "Descrição do componente"
  }

  aoClicar() {
    prosa("Componente clicado! 🎉")
  }
}

criarComponente('meu-componente', MeuComponente)
```

## 🔧 Sistema de Serviços

### Criando um Serviço

```goiasscript
// src/services/meu-servico.gs
pega "@goiano/core" em { Injectable }

@Injectable()
arruma_trem MeuServico {
  aprepara_trem() {
    ocê.dados = []
  }

  obterDados() {
    faz_favor ocê.dados
  }

  adicionarItem(item) {
    ocê.dados.empurrar(item)
    prosa("Item adicionado:", item)
  }
}
```

## 🛠️ Sistema Backend

### Criando um Controlador

```goiasscript
// src/controllers/meu-controller.gs
pega "@goiano/web" em { Controlador, Pegar, Postar, Corpo }
pega "../services/meu-servico" em { MeuServico }

@Controlador("api/itens")
arruma_trem MeuController {
  aprepara_trem(trem meuServico: MeuServico) {
    ocê.meuServico = meuServico
  }

  @Pegar("/")
  listarItens() {
    faz_favor {
      sucesso: certeza,
      dados: ocê.meuServico.obterDados()
    }
  }

  @Postar("/")
  criarItem(@Corpo() dadosItem: coisa) {
    ocê.meuServico.adicionarItem(dadosItem)
    faz_favor {
      sucesso: certeza,
      mensagem: "Item criado com sucesso!"
    }
  }
}
```

## 🎨 Classes TailwindCSS Personalizadas

O framework inclui classes utilitárias goianas pré-definidas:

### Containers
```html
<div class="goiano-container">Conteúdo centralizado</div>
```

### Cards
```html
<div class="goiano-card">Card básico</div>
<div class="goiano-card-hover">Card com efeito hover</div>
```

### Botões
```html
<button class="goiano-btn goiano-btn-primary">Primário</button>
<button class="goiano-btn goiano-btn-secondary">Secundário</button>
<button class="goiano-btn goiano-btn-success">Sucesso</button>
<button class="goiano-btn goiano-btn-warning">Aviso</button>
<button class="goiano-btn goiano-btn-danger">Perigo</button>
```

### Inputs
```html
<input type="text" class="goiano-input" placeholder="Digite aqui...">
```

### Cores Personalizadas
- `goiano-*` - Tons de verde goiano
- `goias-gold-*` - Tons dourados
- `cerrado-*` - Tons terrosos do cerrado

## 🔧 Configuração

### goias.config.js

Personalize sua aplicação através do arquivo `goias.config.js`:

```javascript
module.exports = {
  projeto: {
    nome: "{{projectName}}",
    versao: "1.0.0"
  },
  funcionalidades: {
    hotReload: true,
    tailwindCSS: true,
    componentes: true,
    roteamento: true,
    backend: true
  },
  devServer: {
    porta: 3000,
    abriNoNavegador: true
  }
}
```

## 🌐 Deploy

### Netlify
```bash
npm run build
# Upload da pasta ./dist para Netlify
```

### Vercel
```bash
npm run build
vercel --prod
```

### GitHub Pages
```bash
npm run build
# Configure GitHub Pages para servir da pasta ./dist
```

## 🤝 Comunidade

- 📚 **Documentação**: [goiasscript.dev/docs](https://goiasscript.dev/docs)
- 💬 **Discord**: [discord.gg/goiasscript](https://discord.gg/goiasscript)
- 🐙 **GitHub**: [github.com/goiasscript](https://github.com/goiasscript)
- 📧 **E-mail**: contato@goiasscript.dev

## 📄 Licença

MIT © 2024 GoiásScript Framework

---

**Feito com ❤️ em Goiás por desenvolvedores goianos para o mundo! 🇧🇷**

> *"Programa que nem goiano: simples, direto e eficiente!"*