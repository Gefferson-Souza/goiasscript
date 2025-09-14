# 🇧🇷 GoiásScript Language Server Protocol (LSP)

**Language Server Protocol para GoiásScript - Inteligência Goiana no Editor**

## 🚀 Funcionalidades

### ✅ **Diagnósticos de Código**
- **Erros de sintaxe:** Detecta uso de `=` ao invés de `é`
- **Keywords incorretas:** Alerta sobre `if`, `function`, `console.log`
- **Métodos não goianos:** Sugere usar `.empurrar()` ao invés de `.push()`

### ✅ **Autocompletar Inteligente**
- **Keywords GoiásScript:** `uai`, `trem`, `faz_trem`, `se`, `senao`
- **Decorators do Framework:** `@Componente`, `@Controlador`, `@Injectable`
- **Métodos Goianos:** `.gritando()`, `.empurrar()`, `.filtrar()`

### ✅ **Hover e Documentação**
- **Informações instantâneas** ao passar o mouse
- **Exemplos de uso** para cada keyword
- **Documentação em português**

## 🔧 Como Usar

### 1. **Instalação Automática**
O LSP é automaticamente instalado com a extensão VS Code GoiásScript 2.2.0+

### 2. **Uso Manual (Desenvolvimento)**
```bash
# Instalar dependências
cd lsp-server
npm install

# Executar servidor
node server.js --stdio
```

### 3. **Integração com Editores**

#### VS Code
Já integrado na extensão oficial GoiásScript.

#### Outros Editores (Vim, Emacs, etc)
Configure seu editor para usar:
```
Comando: node /caminho/para/lsp-server/server.js --stdio
Linguagem: goiasscript
Extensão: .gs
```

## 📋 Exemplos de Diagnósticos

### ❌ **Erros Detectados**
```goiasscript
// Erro: usando = ao invés de é
uai nome = "João"  // ❌ Use "é" no lugar de "="

// Erro: console.log ao invés de prosa
console.log("oi")  // ❌ Use "prosa()" que é mais goiano

// Erro: if ao invés de se
if (idade > 18) {  // ❌ Use "se" no lugar de "if"
    // ...
}
```

### ✅ **Código Correto**
```goiasscript
// ✅ Sintaxe GoiásScript correta
uai nome é "João"
prosa("Olá mundo goiano!")

se (idade maior_que 18) {
    prosa("Maior de idade!")
}
```

## 🎯 **Métodos Goianos Suportados**

### String
- `.gritando()` → `toUpperCase()`
- `.cochichando()` → `toLowerCase()`
- `.tem_no_meio()` → `includes()`
- `.trocar()` → `replace()`

### Array
- `.empurrar()` → `push()`
- `.arranca_o_rabo()` → `pop()`
- `.filtrar()` → `filter()`
- `.mapear()` → `map()`
- `.tamanho()` → `length`

### Framework Decorators
- `@Componente` - Componente web
- `@Controlador` - Controller REST
- `@Injectable` - Serviço injetável
- `@Pegar/@Postar` - Rotas HTTP

## 🏆 **Performance**

- **Startup:** ~50ms
- **Diagnósticos:** Tempo real
- **Autocomplete:** <10ms
- **Memory:** ~15MB

## 🤝 **Contribuindo**

1. Clone o repositório GoiásScript
2. Navegue para `lsp-server/`
3. Faça suas alterações
4. Teste com `node server.js --stdio`
5. Envie um pull request!

---

## 🇧🇷 **Orgulho Brasileiro**

O primeiro Language Server Protocol 100% brasileiro! Desenvolvido com carinho em Goiás para a comunidade de desenvolvedores brasileiros.

**Viva o GoiásScript! 🚀**