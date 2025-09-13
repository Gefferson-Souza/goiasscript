# {{projeto_nome}}

{{projeto_descricao}}

## 🚀 Como Usar

### Pré-requisitos
```bash
# Se ainda não tem o GoiásScript instalado globalmente:
npm install -g goiasscript
```

### Desenvolvimento
```bash
# 1. Traduzir o código GoiásScript para JavaScript
goiasscript traduz src/app.gs

# 2. Copiar o arquivo JavaScript gerado para public/
cp src/app.js public/

# 3. Iniciar servidor web local
python -m http.server 8080
# ou: npm run server

# 4. Abrir no navegador: http://localhost:8080
```

### Comandos GoiásScript

```bash
# Executar em modo desenvolvimento (teste rápido)  
goiasscript bota_pra_moer src/app.gs

# Traduzir para JavaScript (para produção web)
goiasscript traduz src/app.gs

# Verificar tipos antes de buildar
goiasscript vê_se_tá_certo src/app.gs

# Debug interativo
gs-fuça fuça src/app.gs

# REPL para testes rápidos
goias
```

### Fluxo de Desenvolvimento Completo

```bash
# 1. Editar src/app.gs
# 2. Verificar se está tudo certo:
goiasscript vê_se_tá_certo src/app.gs

# 3. Traduzir para JavaScript:
goiasscript traduz src/app.gs

# 4. Copiar para pasta pública:
cp src/app.js public/

# 5. Ver resultado no navegador:
python -m http.server 8080
```

## 📁 Estrutura do Projeto

```
{{projeto_nome}}/
├── src/
│   ├── app.gs          # Código GoiásScript principal
│   └── app.js          # JavaScript gerado (após traduzir)
├── public/
│   ├── index.html      # Página HTML principal  
│   ├── styles.css      # Estilos CSS
│   └── app.js          # JavaScript copiado (para web)
├── package.json        # Configurações do projeto
└── README.md          # Este arquivo
```

## 🔧 Dicas de Desenvolvimento

1. **Sempre verifique tipos primeiro**: `goiasscript vê_se_tá_certo src/app.gs`
2. **Para testar rapidamente**: `goiasscript bota_pra_moer src/app.gs`
3. **Para web, sempre traduza**: `goiasscript traduz src/app.gs`
4. **Use o debug quando necessário**: `gs-fuça fuça src/app.gs`
5. **REPL para testes**: `goias`

## 📚 Comandos GoiásScript

- `goiasscript traduz arquivo.gs` - Traduz GoiásScript para JavaScript
- `goiasscript bota_pra_moer arquivo.gs` - Executa arquivo GoiásScript  
- `goiasscript vê_se_tá_certo arquivo.gs` - Verifica tipos
- `gs-fuça fuça arquivo.gs` - Debug interativo
- `goias` - REPL (Roda de Prosa)
- `gs-balaio mostra_os_balaio` - Gerenciar dependências

## 🌐 Sobre Aplicações Web

Esta aplicação web GoiásScript:
- ✅ Usa sintaxe goiana no frontend
- ✅ Compila para JavaScript vanilla  
- ✅ Funciona em qualquer navegador moderno
- ✅ Inclui demonstrações interativas
- ✅ Design responsivo e acessível

## 📖 Documentação

- [GoiásScript v2.0](https://github.com/Gefferson-Souza/goiasscript)
- [Sintaxe GoiásScript](https://github.com/Gefferson-Souza/goiasscript#sintaxe)
- [Exemplos](https://github.com/Gefferson-Souza/goiasscript/tree/main/examples)

---

*Criado com GoiásScript v2.0 - A linguagem de programação goiana* 🇧🇷