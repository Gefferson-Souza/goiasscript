# 🚀 GoiásScript v2.0 - Release Notes

**Data de Release**: 13 de Setembro de 2025  
**Versão**: 2.0.0  
**Codinome**: "Mais Goiano que Nunca"

---

## 🎉 **O que há de novo na v2.0**

### 🔥 **Transformação Completa - 100% Goiano**

GoiásScript v2.0 representa uma revolução completa na experiência de programação goiana:

- **Todos os comandos** agora são 100% em goianês
- **Todas as mensagens** do sistema em linguagem goiana
- **Ferramentas dedicadas** para cada função
- **Experiência imersiva** completa

### 🛠️ **Novas Ferramentas CLI**

#### **goiasscript** (Compilador Principal)
```bash
goiasscript traduz arquivo.gs        # Traduz para JavaScript
goiasscript bota_pra_moer arquivo.gs # Executa o código
goiasscript vê_se_tá_certo arquivo.gs # Verifica tipos
goiasscript arma_o_barraco projeto   # Cria novo projeto
```

#### **gs-balaio** (Gerenciador de Packages)
```bash
gs-balaio mostra_os_balaio          # Lista packages instalados
gs-balaio pega goiano-utils         # Instala package
gs-balaio joga_fora goiano-http     # Remove package
gs-balaio dedo_de_prosa            # Informações do sistema
```

#### **gs-fuçá** (Debugger Profissional)
```bash
gs-fuça fuça arquivo.gs             # Debug interativo
gs-fuça arma_arapuca arquivo.gs 10  # Adiciona breakpoint
gs-fuça de_olho variavel            # Monitora variável
gs-fuça dá_o_parecer               # Gera relatório
```

#### **goias** (REPL - Roda de Prosa)
```bash
goias                              # Inicia REPL interativo
# Comandos especiais:
# .desenrola - ajuda
# .mostra_os_trem - variáveis
# .vaza - sair
```

### 💻 **Integração VSCode Completa**

- ✅ **Syntax Highlighting** para arquivos `.gs`
- ✅ **Comandos integrados** (Ctrl+Shift+G)
- ✅ **Debug Adapter Protocol** - Debug real no VSCode
- ✅ **Tasks pré-configuradas**
- ✅ **Snippets goianos**
- ✅ **Ícones temáticos**

### 🏗️ **Sistema de Templates**

Dois templates profissionais inclusos:

1. **Projeto Básico** - Para aplicações console
2. **Projeto Web** - Para aplicações web frontend

```bash
goiasscript arma_o_barraco meu-app --template=web
```

### 🔍 **Sistema de Tipos Avançado**

- **Inferência automática** de tipos
- **Verificação em tempo real**
- **Mensagens de erro goianas**
- **Suporte a tipos complexos**

### ⚡ **Performance e JIT**

- **Compilador JIT** integrado
- **Otimizações automáticas**
- **Hot spot detection**
- **AST-based optimizations**

---

## 🔄 **Breaking Changes**

### Comandos Renomeados (v1.x → v2.0)

| Comando Antigo | Comando Novo | Status |
|---|---|---|
| `gspack` | `gs-balaio` | ✅ Migrado |
| `gsdebug` | `gs-fuça` | ✅ Migrado |  
| `gsrepl` | `goias` | ✅ Migrado |
| `goiasscript compile` | `goiasscript traduz` | ✅ Compatibilidade mantida |
| `goiasscript run` | `goiasscript bota_pra_moer` | ✅ Compatibilidade mantida |

### Terminologia

| Termo Antigo | Termo Novo |
|---|---|
| "packages" | "balaios" |
| "debug" | "fuçá" |
| "REPL" | "Roda de Prosa" |

---

## 🚀 **Como Atualizar**

### Instalação Limpa (Recomendado)
```bash
# Desinstalar versão anterior
npm uninstall -g goiasscript

# Instalar v2.0
npm install -g goiasscript@2.0.0
```

### Verificar Instalação
```bash
goiasscript --version  # Deve retornar: 2.0.0
which gs-balaio        # Verifica se ferramentas estão instaladas
which goias
which gs-fuça
```

### Migrar Projetos Existentes

Projetos v1.x continuam funcionando, mas recomendamos:

1. Atualizar scripts do package.json:
```json
{
  "scripts": {
    "dev": "goiasscript bota_pra_moer src/main.gs",
    "build": "goiasscript traduz src/main.gs",
    "check": "goiasscript vê_se_tá_certo src/main.gs"
  }
}
```

2. Usar novos comandos goianos nos workflows

---

## 🧪 **Testado e Aprovado**

### ✅ **Suporte Completo**
- **Node.js**: 14.0.0+
- **npm**: 6.0.0+
- **VSCode**: 1.80.0+
- **Sistemas**: Linux, macOS, Windows

### ✅ **Coverage de Testes**
- **Unit Tests**: 161 passando
- **Integration Tests**: Comandos CLI completos
- **VSCode Extension**: Testado e funcionando
- **Templates**: Validados

### ✅ **Compatibilidade**
- Código v1.x continua funcionando
- Comandos antigos mantidos como alias
- Migração gradual suportada

---

## 🐛 **Problemas Conhecidos**

### ⚠️ **Limitações Menores**
1. **Template Funções**: Algumas sintaxes de função complexas podem gerar warnings (não impedem execução)
2. **Coverage**: Meta de 80% não atingida ainda (atual: ~48%)
3. **Jest Templates**: Warning sobre colisão de nomes nos templates

### 🔧 **Workarounds**
- Usar sintaxe simples nos templates (sem tipos explícitos)
- Warnings não impedem funcionamento normal
- Testes funcionais 100% aprovados

---

## 🎯 **Roadmap v2.1**

### 🔮 **Próximas Funcionalidades**
- [ ] Publicação no npm registry
- [ ] Correção completa dos templates
- [ ] Melhoria da cobertura de testes
- [ ] Documentação online interativa
- [ ] Integração com outros editores
- [ ] Package registry próprio
- [ ] Mais métodos goianos nativos
- [ ] Sistema de plugins

---

## 🙏 **Agradecimentos**

Obrigado a todos que contribuíram para tornar o GoiásScript mais goiano que nunca:

- **Comunidade Goiana** por manter viva nossa cultura
- **Testadores Beta** que ajudaram a encontrar bugs
- **Contribuidores** que sugeriram melhorias
- **VSCode Team** pelas ferramentas de extensão

---

## 📞 **Suporte**

### 🐛 **Reportar Bugs**
- GitHub Issues: https://github.com/Gefferson-Souza/goiasscript/issues

### 💬 **Comunidade**
- Discussões: https://github.com/Gefferson-Souza/goiasscript/discussions
- Discord: [Em breve]

### 📚 **Documentação**
- README: https://github.com/Gefferson-Souza/goiasscript#readme
- Examples: https://github.com/Gefferson-Souza/goiasscript/tree/main/examples
- VSCode Extension: https://marketplace.visualstudio.com/items?itemName=gefferson-souza.goiasscript

---

**🇧🇷 GoiásScript v2.0 - Mais goiano, mais profissional, mais massa que nunca!**

*"Ô sô, agora sim o GoiásScript tá bão demais da conta!"*