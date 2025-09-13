# 📚 Exemplos GoiásScript

Esta pasta contém exemplos práticos para demonstrar as funcionalidades do GoiásScript v2.0.

## 🚀 Como Executar os Exemplos

### Usando os Comandos Goianos (v2.0)

```bash
# Traduzir um arquivo GoiásScript para JavaScript
goiasscript traduz examples/basic/exemplo.gs

# Botar pra moer (executar) um arquivo GoiásScript  
goiasscript bota_pra_moer examples/basic/exemplo.gs

# Vê se tá certo (verificar tipos)
goiasscript vê_se_tá_certo examples/basic/exemplo.gs
```

### Usando as Ferramentas Goianas

```bash
# Fuçar o código com o GS-Fuçá (debugger)
gs-fuça fuça examples/basic/exemplo.gs

# Roda de Prosa (REPL interativo)
goias

# Gerenciar balaios (packages)
gs-balaio mostra_os_balaio
```

## 📁 Estrutura dos Exemplos

### `/basic/` - Exemplos Básicos
- `exemplo.gs` - Primeiro programa em GoiásScript
- `exemplo_simples.gs` - Exemplo com funções assíncronas

### `/classes/` - Programação Orientada a Objetos
- `exemplo_classes.gs` - Definição e uso de classes goianas

### `/async/` - Programação Assíncrona  
- `async_exemplo.gs` - Async/await em GoiásScript

### `/advanced/` - Exemplos Avançados
- `teste_instanceof.gs` - Verificação de tipos avançada
- `teste_erros.gs` - Tratamento de erros goianos
- `teste_classes.gs` - Classes complexas
- `teste_classes_simples.gs` - Classes básicas

### `/modules/` - Sistema de Módulos
- `main.gs` - Arquivo principal com imports
- `logger.gs` - Módulo de logging
- `utils.gs` - Utilitários gerais

### `/performance/` - Performance e JIT
- `jit-demo.gs` - Demonstração do compilador JIT

## 🔧 Dicas de Desenvolvimento

1. **Desenvolvimento Rápido**: Use `goiasscript bota_pra_moer arquivo.gs` para executar diretamente
2. **Debug**: Use `gs-fuça fuça arquivo.gs` para debugar seu código
3. **Verificação**: Use `goiasscript vê_se_tá_certo arquivo.gs` antes de commitar
4. **REPL**: Use `goias` para testar comandos rapidamente

## 📖 Mais Informações

- [README Principal](../README.md) - Documentação completa
- [ROADMAP](../ROADMAP.md) - Funcionalidades e progresso
- [Extensão VSCode](../vscode-extension/) - Suporte no editor