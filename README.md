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

Após instalação, você terá acesso a 4 comandos goianos:

```bash
goiasscript  # Compilador principal (traduz, bota_pra_moer, vê_se_tá_certo)
gs-balaio    # Gerenciador de balaios (pega, joga_fora, mostra_os_balaio)
goias        # Roda de Prosa - REPL interativo goiano
gs-fuçá      # Debugger que fuça os detalhes
```

## 🎯 **Início Rápido**

### 1. Armar o barraco (criar novo projeto)
```bash
goiasscript arma_o_barraco meu-projeto
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

### 3. Botar pra moer (executar)
```bash
goiasscript bota_pra_moer main.gs
```

## 🔧 **Métodos Goianos Nativos**

### 📝 **Texto (String)**
```goiasscript
uai texto é "Oi, sô!"

texto.gritando()           // "OI, SÔ!" (era pra_maiusculo)
texto.cochichando()        // "oi, sô!" (era pra_minusculo)
texto.dividir(", ")        // ["Oi", "sô!"]
texto.trocar("sô", "meu")  // "Oi, meu!"
texto.tem_no_meio("Oi")    // certeza (era contem)
texto.tamanho()            // 7
```

### 📋 **Lista (Array)**
```goiasscript
uai numeros é [1, 2, 3, 4, 5]

numeros.mapear(x => x vezes 2)        // [2, 4, 6, 8, 10]
numeros.filtrar(x => x % 2 == 0)      // [2, 4]
numeros.reduzir((a, b) => a mais b)   // 15
numeros.bota_no_final(6)              // Adiciona 6 no final (era empurrar)
numeros.arranca_o_rabo()              // Remove último (era tirar_ultimo)
numeros.tamanho()                     // 6
```

### 🧮 **GoianoMath**
```goiasscript
GoianoMath.sorteia_um()           // Número aleatório 0-1 (era sorteio)
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

## 🛠️ **CLI - Linha de Comando Goiana**

### Comandos Principais
```bash
# Botar o código pra moer (executar)
goiasscript bota_pra_moer arquivo.gs

# Traduzir para JavaScript
goiasscript traduz arquivo.gs

# Ver se tá certo (verificar tipos)
goiasscript vê_se_tá_certo arquivo.gs

# Armar o barraco (criar projeto)
goiasscript arma_o_barraco meu-projeto

# Dedo de prosa (informações)
goiasscript dedo_de_prosa
```

### Comandos de Compatibilidade
```bash
# Os comandos antigos ainda funcionam:
goiasscript run arquivo.gs      # alias para bota_pra_moer
goiasscript compile arquivo.gs   # alias para traduz
goiasscript check-types arquivo.gs  # alias para vê_se_tá_certo
goiasscript new meu-projeto      # alias para arma_o_barraco
goiasscript info                 # alias para dedo_de_prosa
```

### Opções avançadas
```bash
# Traduzir com verbose
goiasscript traduz arquivo.gs --verbose

# Traduzir e executar
goiasscript traduz arquivo.gs --run

# Output customizado
goiasscript traduz arquivo.gs -o saida.js
```

## 🧺 **Gerenciador de Balaios (GS-Balaio)**

### Balaios Built-in
```bash
# Pegar utilitários goianos da feira
gs-balaio pega goiano-utils

# Pegar cliente HTTP
gs-balaio pega goiano-http

# Pegar banco de dados
gs-balaio pega goiano-db
```

### Trabalhar com Balaios
```bash
# Arrumar um balaio novo
gs-balaio arruma_um meu-balaio

# Levar seu balaio pra feira (publicar)
gs-balaio leva_pra_feira

# Mostrar os balaios que você tem
gs-balaio mostra_os_balaio

# Jogar fora um balaio
gs-balaio joga_fora goiano-http

# Dedo de prosa sobre balaios
gs-balaio dedo_de_prosa
```

### Usar Balaios
```goiasscript
// Pegar da feira: gs-balaio pega goiano-utils
pega { formatarCPF, validarEmail } de "goiano-utils"

uai cpf: texto é formatarCPF("12345678901")
prosa("CPF:", cpf)  // "123.456.789-01"

uai email_valido: booleano é validarEmail("test@goias.com")
prosa("Email válido:", email_valido)  // certeza
```

## 💬 **Roda de Prosa (REPL Interativo)**

```bash
goias  # Entra na roda de prosa
```

```
goiás> uai nome é "João"
goiás> nome.gritando()  // métodos goianos!
💬 "JOÃO"

goiás> .desenrola          # Desenrola esse trem (ajuda)
goiás> .mostra_os_trem     # Mostrar variáveis na memória
goiás> .lembra_aí         # Lembra o que já conversamos
goiás> .limpa_o_terreiro   # Limpar tela
goiás> .vaza               # Vaza daqui (sair)
```

## 🔍 **GS-Fuçá - Debugger Goiano**

```bash
# Fuçar um arquivo (debug com arapuca na linha 10)
gs-fuçá fuça arquivo.gs --arapuca 10 --de_olho nome

# Armar arapuca (breakpoint)
gs-fuçá arma_arapuca arquivo.gs 10

# Ficar de olho numa variável
gs-fuçá de_olho nome

# Listar arapucas armadas
gs-fuçá lista_arapuca

# Dá o parecer (gerar relatório)
gs-fuçá dá_o_parecer
```

### Comandos goianos durante a fuçada:
- `toca_o_pau` (c) - Continuar execução
- `um_cadim` (s) - Próxima linha  
- `mostra_os_trem` (v) - Mostrar variáveis
- `mostra_a_ruma` - Call stack (ruma de chamadas)
- `vaza` (q) - Vaza daqui (sair)

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
├── bin/                    # Executáveis CLI Goianos
│   ├── goiasscript.js     # Compilador principal (traduz, bota_pra_moer)
│   ├── gs-balaio.js       # Gerenciador de balaios (pega, joga_fora)
│   ├── goias.js           # Roda de Prosa - REPL interativo
│   └── gs-fuçá.js         # Debugger que fuça os detalhes
├── src/                    # Código fonte
│   ├── compiler/          # Transpiler e lexer
│   ├── types/             # Sistema de tipos goiano
│   ├── modules/           # Sistema de módulos
│   ├── packages/          # Gerenciador de balaios
│   ├── debug/             # Debugger goiano
│   ├── performance/       # JIT Compiler
│   └── goianoMethods/     # Métodos nativos goianos
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