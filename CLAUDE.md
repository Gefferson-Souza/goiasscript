# 🇧🇷 CLAUDE.md - Diretrizes Goianas

## 🎯 **REGRA DE OURO**
O GoiásScript é uma linguagem de programação 100% GOIANA! Tudo que interage com o usuário deve ser em goianês raiz. Só o código interno (funções, variáveis internas) fica em inglês.

## 📋 **Visão Geral do Projeto**

GoiásScript é uma linguagem de programação brasileira que transpila dialeto goiano para JavaScript. É uma linguagem verdadeiramente independente com métodos nativos goianos, JIT Compiler e ecosystem completo.

## 🛠️ **COMANDOS CLI GOIANOS**

### **goiasscript** (Principal)
```bash
# Traduzir GoiásScript para JavaScript
goiasscript traduz arquivo.gs

# Botar o código pra moer (executar)
goiasscript bota_pra_moer arquivo.gs

# Ver se tá certo (verificar tipos)
goiasscript vê_se_tá_certo arquivo.gs

# Armar o barraco (criar projeto)
goiasscript arma_o_barraco meu-projeto

# Dedo de prosa (informações)
goiasscript dedo_de_prosa
```

### **gs-balaio** (Gerenciador de Balaios)
```bash
# Pegar um balaio da feira
gs-balaio pega goiano-utils

# Jogar fora um balaio
gs-balaio joga_fora goiano-http

# Mostrar os balaios que você tem
gs-balaio mostra_os_balaio

# Arrumar um balaio novo
gs-balaio arruma_um meu-balaio

# Levar seu balaio pra feira
gs-balaio leva_pra_feira

# Dedo de prosa sobre balaios
gs-balaio dedo_de_prosa
```

### **gs-fuçá** (Debugger)
```bash
# Fuçar um arquivo em debug
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

### **goias** (Roda de Prosa - REPL)
```bash
# Entrar na roda de prosa
goias

# Comandos especiais dentro da roda de prosa:
# .desenrola - desenrola esse trem (ajuda)
# .mostra_os_trem - mostra as variáveis na memória
# .lembra_aí - lembra o que já conversamos (histórico) 
# .limpa_o_terreiro - limpa a tela
# .zera_o_trem - zera tudo e começa de novo
# .mostra_as_tralha - mostra os balaios instalados
# .vaza - vaza daqui (sair)
```

## 🏗️ **ARQUITETURA GOIANA**

### **Componentes Principais**

1. **src/compiler.js** - Compilador principal com JIT integrado
   - Integra transpilação, análise de tipos, módulos e JIT
   - Sistema de erros goianos (`ErroGoiano`)
   - Otimizações automáticas de performance

2. **Mapeamento de Keywords Goianas**:
   - `uai` → declaração de constante
   - `trem` → declaração de variável
   - `faz_trem` → função (mudou de `presta_serviço`)
   - `prosa()` → console.log()
   - `se` → if
   - `pra` → for
   - `faz_um` → new
   - E muitas outras (veja README.md)

3. **Extensão VS Code** (`vscode-extension/`)
   - Syntax highlighting para arquivos `.gs`
   - Ícones customizados goianos
   - Comandos integrados (Ctrl+Shift+G)

## 🗣️ **LINGUAGEM E IDENTIDADE**

### ✅ **SEMPRE em Goianês:**
- Comandos CLI (`bota_pra_moer`, `traduz`, `arma_o_barraco`, `pega`, `fuça`)
- Mensagens de erro ("Ô rapaz! Deu ruim aqui...")
- Respostas do sistema ("Tá pronto, sô!", "Barraco armado com sucesso!")
- Keywords da linguagem (`uai`, `faz_trem`, `prosa`)
- Nomes de packages (`goiano-utils`, `goiano-http`)
- Nomes dos tools (`gs-balaio`, `gs-fuçá`, `goias`)
- Comandos do debugger (`arma_arapuca`, `de_olho`, `dá_o_parecer`)
- Comandos do REPL (`.desenrola`, `.mostra_os_trem`, `.vaza`)
- Documentação para usuários

### ✅ **SEMPRE em Inglês:**
- Código interno (funções, classes, variáveis)
- Nomes de arquivos internos 
- Comentários de código interno
- APIs internas

## 🎨 **MÉTODOS GOIANOS NATIVOS**

### **Texto**
- `.gritando()` → toUpperCase
- `.cochichando()` → toLowerCase  
- `.tem_no_meio()` → includes
- `.trocar()` → replace
- `.dividir()` → split

### **Lista**
- `.bota_no_final()` → push
- `.arranca_o_rabo()` → pop
- `.mapear()` → map
- `.filtrar()` → filter

### **GoianoMath**
- `sorteia_um()` → random
- `arredondar()` → round
- `maior()` → max

## 💬 **TOM DAS MENSAGENS**

### **Sucesso**
- "Tá pronto, sô!"
- "Deu bom!"  
- "Fichinha!"
- "Bão demais!"

### **Erro**
- "Ô rapaz! Deu ruim aqui..."
- "Eita! Algo não tá certo..."
- "Ô sô! Tem um problema aí..."

### **Aviso**
- "Ô rapaz! Ocê disse que..."
- "Vê se não tá confundindo..."
- "Dá uma olhada aí..."

## 🧺 **BALAIOS BUILT-IN**
- `goiano-utils` → Utilitários goianos
- `goiano-http` → Cliente HTTP
- `goiano-db` → Banco de dados
- `goiano-teste` → Framework de testes

*Nota: Agora são chamados de "balaios" em vez de "packages"! Use `gs-balaio pega <nome>` para instalar.*

## 🎯 **FUNCIONALIDADES PRINCIPAIS**

- Sistema de tipos goiano completo (`texto`, `numero`, `lista`, `coisa`)
- Módulos nativos GoiásScript (`pega`/`troca_ideia`)
- JIT Compiler com otimizações automáticas
- 4 ferramentas CLI completas com nomes goianos:
  - `goiasscript` - Compilador principal
  - `gs-balaio` - Gerenciador de balaios
  - `gs-fuçá` - Debugger que fuça os detalhes
  - `goias` - Roda de prosa (REPL)
- Métodos 100% goianos (sem dependência de JavaScript)
- AST Parser para análises avançadas
- Extensão VS Code completa

## 🚫 **O QUE NÃO FAZER**
- Nunca misturar inglês nas mensagens para usuário
- Não usar termos técnicos sem explicação goiana
- Evitar formalidade excessiva
- Não quebrar a imersão goiana
- Não adicionar features que não sejam goianas
- Nunca voltar aos nomes antigos (`gspack`, `gsdebug`, `gsrepl`)
- Não usar "package" - sempre "balaio"

## 🎯 **OBJETIVO**
Criar uma experiência única onde programar em GoiásScript é como ter uma prosa boa com um amigo goiano que entende muito de programação!