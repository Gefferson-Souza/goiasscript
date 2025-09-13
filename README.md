# 🇧🇷 GoiásScript v2.0

> **Linguagem de programação goiana com métodos 100% nativos**

GoiásScript é uma linguagem de programação inspirada no dialeto goiano que compila para JavaScript. Agora na versão 2.0 com **métodos nativos goianos**, **sistema de tipos**, **módulos próprios** e **ferramentas profissionais completas**.

[![Versão](https://img.shields.io/badge/versão-2.0.0-green.svg)](https://github.com/Gefferson-Souza/goiasscript)
[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)
[![Cobertura](https://img.shields.io/badge/cobertura-70%2B-brightgreen.svg)](coverage)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](package.json)

## ✨ **Novidades da v2.0**

- 🔥 **Métodos 100% Goianos** - Sem dependência de JavaScript
- 📊 **Sistema de Tipos Nativo** - Com inferência automática
- 📦 **Módulos GoiásScript** - Import/export goiano
- 🛠️ **CLI Completo** - Compile, execute, debug
- 📋 **Package Manager** - Sistema próprio (.gspack)
- 🖥️ **REPL Interativo** - Terminal de desenvolvimento
- 🐛 **Debugger Nativo** - Debug com breakpoints
- 🎨 **VS Code Extension** - Suporte completo no editor

## 🚀 **Instalação**

```bash
npm install -g goiasscript
```

## 📋 **Ferramentas Disponíveis**

Após instalação, você terá acesso a 4 comandos:

```bash
goiasscript  # Compilador principal
gspack       # Gerenciador de packages
gsrepl       # Terminal interativo
gsdebug      # Debugger nativo
```

## 🎯 **Início Rápido**

### 1. Criar novo projeto
```bash
goiasscript new meu-projeto
cd meu-projeto
```

### 2. Arquivo exemplo (`main.gs`)
```goiasscript
// GoiásScript v2.0 - Métodos 100% Goianos!

uai nome: texto é "João da Silva"
uai idade: numero é 30
uai tecnologias: lista é ["GoiásScript", "JavaScript", "Node.js"]

// Função goiana
faz_trem saudar(pessoa: texto): texto {
  faz_favor "Oi " mais pessoa mais ", tudo beleza?"
}

// Usando métodos goianos nativos
uai nome_maiusculo: texto é nome.pra_maiusculo()
uai primeira_tech: texto é tecnologias[0]
uai saudacao: texto é saudar(nome)

prosa("Nome:", nome_maiusculo)
prosa("Primeira tecnologia:", primeira_tech)  
prosa(saudacao)

// Math goiano
uai numero_sorte: numero é GoianoMath.arredondar(GoianoMath.sorteio() vezes 100)
prosa("Número da sorte:", numero_sorte)
```

### 3. Executar
```bash
goiasscript run main.gs
```

## 🔧 **Métodos Goianos Nativos**

### 📝 **Texto (String)**
```goiasscript
uai texto é "Oi, sô!"

texto.pra_maiusculo()      // "OI, SÔ!"
texto.pra_minusculo()      // "oi, sô!"
texto.dividir(", ")        // ["Oi", "sô!"]
texto.trocar("sô", "meu")  // "Oi, meu!"
texto.contem("Oi")         // certeza (true)
texto.tamanho()            // 7
```

### 📋 **Lista (Array)**
```goiasscript
uai numeros é [1, 2, 3, 4, 5]

numeros.mapear(x => x vezes 2)        // [2, 4, 6, 8, 10]
numeros.filtrar(x => x % 2 == 0)      // [2, 4]
numeros.reduzir((a, b) => a mais b)   // 15
numeros.empurrar(6)                   // Adiciona 6 no final
numeros.tamanho()                     // 6
```

### 🧮 **GoianoMath**
```goiasscript
GoianoMath.sorteio()              // Número aleatório 0-1
GoianoMath.arredondar(3.7)        // 4
GoianoMath.maior(10, 25, 5)       // 25
GoianoMath.potencia(2, 3)         // 8
```

### 📦 **Coisa (Object)**
```goiasscript
uai pessoa é { nome: "Maria", idade: 25 }

Object.chaves(pessoa)      // ["nome", "idade"]
Object.valores(pessoa)     // ["Maria", 25]
```

## 📦 **Sistema de Modules**

### Import/Export Goiano
```goiasscript
// utils.gs
faz_trem formatar(texto: texto): texto {
  faz_favor texto.pra_maiusculo().aparar()
}

uai VERSAO: texto é "2.0.0"

troca_ideia { formatar, VERSAO }
```

```goiasscript
// main.gs
pega { formatar, VERSAO } de "./utils"

uai resultado: texto é formatar("  oi sô  ")
prosa("Resultado:", resultado)  // "OI SÔ"
prosa("Versão:", VERSAO)       // "2.0.0"
```

## 🛠️ **CLI - Linha de Comando**

### Compilação e Execução
```bash
# Executar arquivo
goiasscript run arquivo.gs

# Compilar para JavaScript
goiasscript compile arquivo.gs

# Verificar tipos
goiasscript check-types arquivo.gs

# Criar projeto
goiasscript new meu-projeto

# Informações
goiasscript info
```

### Opções avançadas
```bash
# Compilar com verbose
goiasscript compile arquivo.gs --verbose

# Compilar e executar
goiasscript compile arquivo.gs --run

# Output customizado
goiasscript compile arquivo.gs -o saida.js
```

## 📦 **Gerenciador de Packages (GSPack)**

### Packages Built-in
```bash
# Instalar utilitários goianos
gspack install goiano-utils

# Instalar cliente HTTP
gspack install goiano-http

# Instalar banco de dados
gspack install goiano-db
```

### Criar Package
```bash
# Criar novo package
gspack create meu-package

# Publicar package
gspack publish
```

### Usar Package
```goiasscript
// Instalar: gspack install goiano-utils
pega { formatarCPF, validarEmail } de "goiano-utils"

uai cpf: texto é formatarCPF("12345678901")
prosa("CPF:", cpf)  // "123.456.789-01"

uai email_valido: booleano é validarEmail("test@goias.com")
prosa("Email válido:", email_valido)  // certeza
```

## 🖥️ **REPL Interativo**

```bash
gsrepl
```

```
🇧🇷 goiás> uai nome é "João"
🇧🇷 goiás> nome.pra_maiusculo()
📤 "JOÃO"

🇧🇷 goiás> .help      # Comandos especiais
🇧🇷 goiás> .vars      # Mostrar variáveis
🇧🇷 goiás> .history   # Histórico
🇧🇷 goiás> .exit      # Sair
```

## 🐛 **Debugger Nativo**

```bash
# Debug com breakpoint na linha 10
gsdebug debug arquivo.gs -b 10

# Debug monitorando variável
gsdebug debug arquivo.gs -w nome

# Debug com configuração
gsdebug debug arquivo.gs -c debug.json
```

### Comandos durante debug:
- `continue` (c) - Continuar execução
- `step` (s) - Próxima linha
- `vars` (v) - Mostrar variáveis
- `stack` - Call stack
- `quit` (q) - Sair

## 🎨 **Extensão VS Code**

### Instalação
```bash
# Instalar extensão automaticamente
cd vscode-extension
npm run package
code --install-extension goiasscript-2.0.0.vsix
```

### Recursos da extensão:
- ✅ Syntax highlighting completo
- ✅ Ícones customizados para arquivos .gs
- ✅ Snippets GoiásScript
- ✅ Comandos integrados (Ctrl+Shift+G)
- ✅ Validação em tempo real
- ✅ Configurações personalizadas

## 📊 **Sistema de Tipos**

### Tipos Goianos
```goiasscript
// Declaração com tipos explícitos
uai nome: texto é "João"
uai idade: numero é 30
uai ativo: booleano é certeza
uai lista: lista é [1, 2, 3]
uai dados: coisa é { id: 1, nome: "Teste" }

// Função com tipos
faz_trem calcular(a: numero, b: numero): numero {
  faz_favor a mais b
}
```

### Inferência Automática
```goiasscript
// GoiásScript infere os tipos automaticamente
uai texto é "Olá"          // Tipo: texto
uai numero é 42            // Tipo: numero
uai verdadeiro é certeza   // Tipo: booleano
uai lista é [1, 2, 3]      // Tipo: lista
```

### Warnings Goianos
```
⚠️ Ô rapaz! Você disse que 'idade' é número, mas o valor é texto!
💡 Vê se não tá confundindo o tipo ou se o valor tá certo.
```

## 🏗️ **Estrutura do Projeto**

```
goiasscript/
├── bin/                    # Executáveis CLI
│   ├── goiasscript.js     # Compilador principal
│   ├── gspack.js          # Package manager
│   ├── gsrepl.js          # REPL interativo
│   └── gsdebug.js         # Debugger
├── src/                    # Código fonte
│   ├── compiler/          # Transpiler e lexer
│   ├── types/             # Sistema de tipos
│   ├── modules/           # Sistema de módulos
│   ├── packages/          # Package manager
│   ├── debug/             # Debugger
│   └── goianoMethods/     # Métodos nativos
├── examples/              # Exemplos
├── tests/                 # Testes
├── docs/                  # Documentação
├── vscode-extension/      # Extensão VS Code
└── README.md              # Este arquivo
```

## 🧪 **Testes**

```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

**Cobertura atual: 70%+**
- ✅ Transpiler: 85%
- ✅ Sistema de Tipos: 96%
- ✅ Sistema de Módulos: 98%
- ✅ CLI: 75%

## 🗺️ **Roadmap**

### ✅ **Fase 1 - Fundação (CONCLUÍDA)**
- [x] Lexer e Parser básico
- [x] Transpiler GoiásScript → JavaScript
- [x] Testes unitários e integração

### ✅ **Fase 2 - Tipos e Módulos (CONCLUÍDA)**
- [x] Sistema de tipos com inferência
- [x] Sistema de módulos nativo
- [x] Warnings e validações goianas

### ✅ **Fase 3 - Ecosystem (CONCLUÍDA)**
- [x] CLI completo (goiasscript)
- [x] Package manager (gspack)
- [x] REPL interativo (gsrepl)
- [x] Debugger nativo (gsdebug)

### ✅ **Fase 4 - Métodos Nativos (CONCLUÍDA)**
- [x] Métodos goianos para String, Array, Object
- [x] GoianoMath para operações matemáticas
- [x] Bloqueio de métodos JavaScript
- [x] Runtime goiano completo

### 🚀 **Próximas Fases**
- 🔄 **Fase 5 - Performance**: JIT compiler, otimizações
- 🌐 **Fase 6 - Web**: Transpiler para browser, PWA
- ☁️ **Fase 7 - Cloud**: Deploy automático, serverless

## 🤝 **Contribuição**

1. Faça fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Código de Conduta
- Use terminologia goiana sempre que possível
- Mantenha a consistência com o dialeto
- Adicione testes para novas funcionalidades
- Documente em português brasileiro

## 📄 **Licença**

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 **Autor**

**Gefferson Souza**
- GitHub: [@Gefferson-Souza](https://github.com/Gefferson-Souza)
- Email: gefferson.souza@example.com

## 🙏 **Agradecimentos**

- Comunidade goiana pela inspiração
- Contribuidores do projeto
- Usuários que testaram e deram feedback

## 📚 **Documentação Adicional**

- [📖 Métodos Goianos Completos](docs/METODOS_GOIANOS.md)
- [🗺️ Roadmap Detalhado](ROADMAP.md)
- [📝 Changelog](CHANGELOG.md)
- [🔒 Segurança](SECURITY.md)
- [🤝 Contribuição](CONTRIBUTING.md)

---

<div align="center">

**🇧🇷 Feito com ❤️ em Goiás**

*"Agora sim, sô! GoiásScript virou linguagem de programação de verdade!"*

[![Estrelas](https://img.shields.io/github/stars/Gefferson-Souza/goiasscript?style=social)](https://github.com/Gefferson-Souza/goiasscript/stargazers)

</div>