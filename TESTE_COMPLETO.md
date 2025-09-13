# 🧪 Como Testar o GoiásScript v2.0 Completo

## 📋 Lista de Testes

### 1. Testes Básicos dos Comandos Goianos

```bash
# Testar comando traduz
goiasscript traduz examples/basic/exemplo.gs

# Testar comando bota_pra_moer  
goiasscript bota_pra_moer examples/basic/exemplo.gs

# Testar comando vê_se_tá_certo
goiasscript vê_se_tá_certo examples/basic/exemplo.gs

# Testar arma_o_barraco (criar projeto)
goiasscript arma_o_barraco meu-teste-goiano
```

### 2. Testes das Ferramentas Goianas

```bash
# Testar GS-Balaio (gerenciador de packages)
gs-balaio mostra_os_balaio
gs-balaio dedo_de_prosa

# Testar Roda de Prosa (REPL)
goias
# (digite .sair para sair)

# Testar GS-Fuçá (debugger)
gs-fuça fuça examples/basic/exemplo.gs
```

### 3. Testes Avançados

```bash
# Executar suite completa de testes
npm test

# Testar apenas CLI
npm test tests/unit/cli.test.js

# Testar integração CLI goiano
npm test tests/integration/cli-goiano.test.js

# Testar coverage
npm run test:coverage
```

### 4. Testar Templates

```bash
# Criar projeto básico
mkdir test-projeto && cd test-projeto
goiasscript arma_o_barraco projeto-teste

# Testar comandos no projeto criado
cd projeto-teste
goiasscript vê_se_tá_certo src/main.gs
goiasscript bota_pra_moer src/main.gs
goiasscript traduz src/main.gs
```

### 5. Testar VSCode Integration

```bash
# Abrir projeto no VSCode
code .

# Testar:
# 1. Abrir arquivo .gs
# 2. Usar Ctrl+Shift+G Ctrl+T (traduzir)
# 3. Usar Ctrl+Shift+G Ctrl+R (executar)
# 4. Usar F5 para debug
# 5. Verificar syntax highlighting
```

### 6. Teste de Instalação Global

```bash
# Desinstalar se já instalado
npm uninstall -g goiasscript

# Instalar globalmente
npm install -g .

# Testar comandos globais
which goiasscript
which gs-balaio
which goias
which gs-fuça

# Testar funcionamento global
goiasscript --version
goiasscript --help
```

## ✅ Checklist de Funcionalidades

### Comandos CLI
- [ ] `goiasscript traduz arquivo.gs` - traduz para JS
- [ ] `goiasscript bota_pra_moer arquivo.gs` - executa código  
- [ ] `goiasscript vê_se_tá_certo arquivo.gs` - verifica tipos
- [ ] `goiasscript arma_o_barraco nome` - cria projeto
- [ ] `goiasscript --version` - mostra versão
- [ ] `goiasscript --help` - mostra ajuda

### Ferramentas Goianas
- [ ] `gs-balaio mostra_os_balaio` - lista packages
- [ ] `gs-balaio dedo_de_prosa` - informações
- [ ] `goias` - REPL funciona
- [ ] `gs-fuça fuça arquivo.gs` - debugger
- [ ] `gs-debug-adapter` - debug adapter

### VSCode Extension
- [ ] Syntax highlighting em arquivos .gs
- [ ] Comandos no Command Palette
- [ ] Atalhos de teclado funcionam
- [ ] Debug integrado funciona
- [ ] Tasks pré-configuradas funcionam

### Templates
- [ ] Template básico cria projeto funcional
- [ ] Template web cria aplicação web
- [ ] README dos templates estão corretos
- [ ] Comandos GoiásScript funcionam nos projetos

### Testes Automatizados
- [ ] `npm test` passa sem erros críticos
- [ ] Testes de integração CLI funcionam
- [ ] Coverage está melhorando
- [ ] Testes específicos dos comandos goianos passam

## 🐛 Possíveis Problemas e Soluções

### Comando não encontrado
```bash
# Solução: Reinstalar globalmente
npm install -g .
```

### Arquivo não executa
```bash
# Verificar se arquivos bin/ têm permissão
chmod +x bin/*.js
```

### VSCode não reconhece sintaxe
```bash
# Reinstalar extensão
cd vscode-extension
npm run package
code --install-extension goiasscript-2.0.0.vsix
```

### Testes falhando
```bash
# Instalar dependências de dev
npm install
npm run test:coverage
```

## 🚀 Teste Rápido (5 minutos)

```bash
# 1. Testar comando básico
echo 'prosa("Opa, sô!");' > teste.gs
goiasscript bota_pra_moer teste.gs

# 2. Testar tradução
goiasscript traduz teste.gs
cat teste.js

# 3. Testar verificação
goiasscript vê_se_tá_certo teste.gs

# 4. Testar REPL
echo '.sair' | goias

# 5. Testar criação de projeto
goiasscript arma_o_barraco teste-rapido
cd teste-rapido
goiasscript bota_pra_moer src/main.gs
```

Se todos esses testes passarem, o GoiásScript está 100% funcional! 🎉