# 🇧🇷 {{projectName}} - Framework Roda de Prosa

**Clean Architecture 100% Goiana com GoiásScript + Bun**

{{projeto_descricao}}

## 🎯 **O que é o Framework Roda de Prosa?**

O **Roda de Prosa** é um framework full-stack que implementa **Clean Architecture** com nomenclatura 100% brasileira, utilizando GoiásScript e powered by Bun para máxima performance.

### ✨ **Principais Características**

- 🏗️ **Clean Architecture nativa** com separação clara de responsabilidades
- 🇧🇷 **Nomenclatura totalmente brasileira** (cores, chão_de_fabrica, terreiro_da_prosa)
- ⚡ **Ultra performance com Bun** (2x mais rápido que Node.js)
- 🎯 **Injeção de Dependência goiana** com decorators nativos
- 📦 **Decorators automáticos** (@Entidade, @CasoDeUso, @Controlador)
- 🔥 **Hot Reload full-stack** para desenvolvimento
- 🎨 **TailwindCSS integrado** com tema goiano
- 🧪 **Sistema de testes** integrado
- 🚀 **CLI geradores** para automatizar criação de código

## 🏗️ **Arquitetura Clean Goiana**

```
{{projectName}}/
├── src/                          # 🏗️ BACKEND (Clean Architecture)
│   ├── cores/                    # ❤️ CORAÇÃO - Lógica de negócio pura
│   │   └── usuarios/
│   │       ├── entidades/        # 🏗️ Entidades de domínio
│   │       ├── casos_de_uso/     # 🎯 Casos de uso (interactors)
│   │       └── portas/           # 🚪 Interfaces (ports)
│   │
│   ├── chao_de_fabrica/          # 🏭 INFRAESTRUTURA - Adaptadores
│   │   ├── http/                 # 🌐 Controllers HTTP
│   │   ├── banco_de_dados/       # 🗄️ Repositórios (adapters)
│   │   └── autenticacao/         # 🔐 Serviços externos
│   │
│   └── balaios_compartilhados/   # 📦 Utilitários compartilhados
│       ├── decorators/           # 🎨 Decorators (@Entidade, @CasoDeUso)
│       └── di/                   # 💉 Container de Injeção de Dependência
│
├── terreiro_da_prosa/            # 🎨 FRONTEND
│   ├── componentes/              # 📦 Componentes reutilizáveis
│   ├── paginas/                  # 📄 Páginas/Rotas
│   └── servicos/                 # 🔗 Serviços de API
│
└── tests/                        # 🧪 Testes automatizados
```

## 🚀 **Começando**

### 1. **Pré-requisitos**

```bash
# Instalar Bun (ultra-fast JavaScript runtime)
curl -fsSL https://bun.sh/install | bash

# Verificar versão
bun --version
```

### 2. **Desenvolvimento**

```bash
# Instalar dependências (ultra-rápido com Bun)
bun install

# Rodar em modo desenvolvimento com hot reload
bun run dev

# Aplicação rodando em:
# 🌐 http://localhost:3000
```

### 3. **Build para Produção**

```bash
# Build da aplicação
bun run build

# Rodar em produção
bun run start
```

## 🎯 **Decorators Goianos**

O framework utiliza decorators nativos para marcar e configurar as classes:

### 🏗️ **@Entidade** - Domínio Puro

```goiasscript
@Entidade({
    nome: "Usuario",
    tabela: "usuarios",
    validacoes: [
        { campo: "nome", tipo: "obrigatorio" },
        { campo: "email", tipo: "email" }
    ]
})
arruma_trem Usuario {
    aprepara_trem(dados) {
        este.nome é dados.nome
        este.email é dados.email
    }

    eh_valida() {
        // Lógica de validação aqui
    }
}
```

### 🎯 **@CasoDeUso** - Lógica de Negócio

```goiasscript
@CasoDeUso({
    nome: "CriarUsuario",
    dominio: "usuarios"
})
arruma_trem CriarUsuario {
    @Injetar("UsuarioRepositorio")
    repositorio

    async executar(dados_usuario) {
        uai usuario é faz_um Usuario(dados_usuario)
        // Aplicar regras de negócio...
        faz_favor await este.repositorio.salvar(usuario)
    }
}
```

### 🌐 **@Controlador** - API HTTP

```goiasscript
@Controlador({ rota: "/api/v1/usuarios" })
arruma_trem UsuarioControlador {
    @Injetar("CriarUsuario")
    criar_usuario_caso_de_uso

    @Postar("/")
    async criar(req, res) {
        uai resultado é await este.criar_usuario_caso_de_uso.executar(req.body)
        res.json(este.resposta_de_sucesso(resultado))
    }
}
```

## 🛠️ **CLI Geradores**

Automatize a criação de código com os geradores integrados:

```bash
# Gerar novo caso de uso
bun run gerar:caso_de_uso usuarios CriarUsuario

# Gerar nova entidade
bun run gerar:entidade usuarios Usuario

# Gerar controlador
bun run gerar:controlador usuarios UsuarioControlador

# Gerar componente frontend
bun run gerar:componente usuario UsuarioCard
```

## 📋 **Comandos Disponíveis**

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Desenvolvimento com hot reload |
| `bun run build` | Build para produção |
| `bun run start` | Executar em produção |
| `bun run test` | Executar testes |
| `bun run test:watch` | Testes em modo watch |
| `bun run gerar:entidade` | Gerar nova entidade |
| `bun run gerar:caso_de_uso` | Gerar caso de uso |
| `bun run gerar:controlador` | Gerar controlador |

## 🧪 **Testando a API**

### Criar usuário:

```bash
curl -X POST http://localhost:3000/api/v1/usuarios \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "João da Silva",
    "email": "joao@exemplo.com",
    "senha": "MinhaSenh@123"
  }'
```

### Listar usuários:

```bash
curl http://localhost:3000/api/v1/usuarios
```

### Status da aplicação:

```bash
curl http://localhost:3000/health
```

## 🎨 **Customização**

### Configuração do Tema Goiano (TailwindCSS)

Edite `tailwind.config.js` para personalizar o tema:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'goiano': {
          50: '#f0fdf4',
          500: '#16a34a',
          900: '#14532d'
        }
      }
    }
  }
}
```

### Configuração do Framework

Edite `goias.config.js`:

```javascript
export default {
  framework: "roda-de-prosa",
  database: {
    type: "postgresql",
    url: process.env.DATABASE_URL
  },
  auth: {
    enabled: true,
    jwt_secret: process.env.JWT_SECRET
  }
}
```

## 📊 **Performance**

O Framework Roda de Prosa + Bun oferece performance superior:

- 🚀 **98% mais rápido** na instalação de dependências vs NPM
- ⚡ **2x mais rápido** na execução vs Node.js
- 🏗️ **Build otimizado** com transpilação GoiásScript nativa
- 🔥 **Hot reload** com WebSocket de alta performance

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie uma branch: `git checkout -b nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature goiana'`
4. Push: `git push origin nova-feature`
5. Abra um Pull Request

## 📄 **Licença**

MIT License - veja [LICENSE.md](LICENSE.md) para detalhes.

## 🇧🇷 **Orgulho Brasileiro**

Desenvolvido com carinho em Goiás para a comunidade brasileira de desenvolvedores.

**Viva o GoiásScript! Viva a Roda de Prosa!** 🚀

---

*Criado por: {{autor_nome}}*
*Data: {{data_criacao}}*