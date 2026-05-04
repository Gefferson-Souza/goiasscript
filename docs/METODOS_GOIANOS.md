# 🇧🇷 Métodos Nativos Goianos — GoiásScript

> Última revisão: 2026-05-04 (alinhado com v1.5.0-rc.1)

## 📖 Introdução

O GoiásScript possui **métodos 100% goianos** que substituem os métodos
JavaScript. Esta referência cobre os métodos nativos disponíveis em runtime
após transpilação. Para a sintaxe da linguagem em si, veja o
[README](../README.md).

---

## 🔒 **Bloqueio de Métodos JavaScript**

⚠️ **IMPORTANTE**: Métodos JavaScript não-goianos são **automaticamente bloqueados** e geram warnings:

```goiasscript
// ❌ PROIBIDO - gera warning
nome.replace("João", "Maria")  // Warning: Use 'trocar' em vez disso
numeros.map(x => x * 2)        // Warning: Use 'mapear' em vez disso
Math.random()                  // Warning: Use 'GoianoMath.sorteio' em vez disso

// ✅ CORRETO - métodos goianos
nome.trocar("João", "Maria")   
numeros.mapear(x => x vezes 2) 
GoianoMath.sorteio()           
```

---

## 📝 **Tipos Goianos**

### Tipos Básicos:
- `texto` - String/texto
- `numero` - Number/número  
- `booleano` - Boolean
- `lista` - Array
- `coisa` - Object
- `faz_trem` - Function
- `nada` - null/undefined

### Valores Especiais:
- `certeza` = true
- `de_jeito_nenhum` = false
- `nada` = null
- `indefinido` = undefined

---

## 🔤 **Métodos para TEXTO (String)**

### Transformação:
```goiasscript
uai nome é "João da Silva"

// Maiúsculo/Minúsculo
nome.pra_maiusculo()     // "JOÃO DA SILVA"
nome.pra_minusculo()     // "joão da silva"
nome.aparar()            // Remove espaços das bordas
```

### Busca e Análise:
```goiasscript
// Informações
nome.tamanho()           // 13 (número de caracteres)
nome.contem("João")      // certeza (true)
nome.posicao_de("Silva") // 8 (posição do texto)
nome.comeca_com("João")  // certeza
nome.termina_com("Silva") // certeza

// Extrair partes
nome.letra_em(0)         // "J" (primeira letra)
nome.pedaco(0, 4)        // "João" (substring)
nome.fatiar(5)           // "da Silva" (slice)
```

### Manipulação:
```goiasscript
// Substituir
nome.trocar("João", "Maria")    // "Maria da Silva"

// Dividir em lista
nome.dividir(" ")               // ["João", "da", "Silva"]

// Juntar lista em texto
uai palavras é ["Oi", "sô"]
palavras.juntar(" ")            // "Oi sô"
```

---

## 📋 **Métodos para LISTA (Array)**

### Transformação:
```goiasscript
uai numeros é [1, 2, 3, 4, 5]

// Transformar cada elemento
numeros.mapear(x => x vezes 2)        // [2, 4, 6, 8, 10]

// Filtrar elementos
numeros.filtrar(x => x % 2 == 0)      // [2, 4] (só pares)

// Reduzir a um valor
numeros.reduzir((a, b) => a mais b)   // 15 (soma total)

// Executar para cada
numeros.pra_cada(x => prosa(x))       // Imprime cada número
```

### Busca e Análise:
```goiasscript
// Informações
numeros.tamanho()         // 5 (quantidade de elementos)
numeros.contem(3)         // certeza (contém o número 3)
numeros.posicao_de(4)     // 3 (posição do número 4)
numeros.achar(x => x > 3) // 4 (primeiro número maior que 3)
```

### Manipulação:
```goiasscript
// Adicionar/Remover
numeros.empurrar(6)         // Adiciona no final
numeros.por_primeiro(0)     // Adiciona no início
numeros.tirar_ultimo()      // Remove e retorna último
numeros.tirar_primeiro()    // Remove e retorna primeiro

// Ordenação
numeros.ordenar()           // Ordena crescente
numeros.inverter()          // Inverte ordem

// Combinar listas
uai mais_numeros é [6, 7, 8]
numeros.juntar_lista(mais_numeros)  // [1,2,3,4,5,6,7,8]

// Modificar no meio
numeros.emendar(2, 1, 99)   // Remove 1 elemento na posição 2, adiciona 99
```

---

## 🎯 **Métodos para COISA (Object)**

```goiasscript
uai pessoa é {
  nome: "Maria",
  idade: 30,
  cidade: "Goiânia"
}

// Obter informações
Object.chaves(pessoa)     // ["nome", "idade", "cidade"]
Object.valores(pessoa)    // ["Maria", 30, "Goiânia"]  
Object.entradas(pessoa)   // [["nome", "Maria"], ...]

// Verificar propriedade
pessoa.tem_propriedade("nome")  // certeza

// Misturar objetos
uai extras é { profissao: "Desenvolvedora" }
Object.misturar(pessoa, extras)  // Adiciona profissao à pessoa
```

---

## 🧮 **GoianoMath - Métodos Matemáticos**

### Números Aleatórios:
```goiasscript
GoianoMath.sorteio()                    // 0.0 - 1.0 aleatório
```

### Arredondamento:
```goiasscript
uai numero é 3.7

GoianoMath.arredondar(numero)           // 4 (arredonda padrão)
GoianoMath.arredondar_cima(numero)      // 4 (sempre para cima)
GoianoMath.arredondar_baixo(numero)     // 3 (sempre para baixo)
```

### Comparações:
```goiasscript
GoianoMath.maior(10, 25, 5, 30)        // 30 (maior número)
GoianoMath.menor(10, 25, 5, 30)        // 5 (menor número)
GoianoMath.absoluto(-15)               // 15 (valor absoluto)
```

### Potências e Raízes:
```goiasscript
GoianoMath.potencia(2, 3)              // 8 (2 elevado a 3)
GoianoMath.raiz_quadrada(16)           // 4 (raiz quadrada)
```

### Constantes:
```goiasscript
GoianoMath.PI                          // 3.14159...
GoianoMath.E                           // 2.71828...
```

---

## 📅 **Métodos para DATA (Date)**

```goiasscript
uai agora é faz_um Date()

// Obter partes da data
agora.pegar_ano()          // 2024
agora.pegar_mes()          // 8 (setembro = 8, começa do 0)
agora.pegar_dia()          // 12
agora.pegar_horas()        // 14
agora.pegar_minutos()      // 30
agora.pegar_segundos()     // 45
```

---

## 🌍 **Funções Globais Goianas**

### Conversão de Tipos:
```goiasscript
vira_numero("123")         // 123 (string para número)
vira_decimal("123.45")     // 123.45 (string para decimal)
eh_nao_numero("abc")       // certeza (verifica se NaN)
```

### Temporizadores:
```goiasscript
// Executar depois de um tempo
depois_de(() => {
  prosa("Executou!")
}, 1000)  // 1 segundo

// Repetir a cada intervalo
uai timer é repetir_a_cada(() => {
  prosa("Tick!")
}, 500)  // A cada 0.5 segundos

// Cancelar temporizadores
cancelar_depois(timerId)
cancelar_repeticao(timer)
```

### Console Goiano:
```goiasscript
prosa("Mensagem normal")           // console.log
prosa_erro("Algo deu errado")      // console.error  
prosa_aviso("Cuidado!")            // console.warn
```

---

## 🎯 **Exemplos Práticos**

### Processamento de Texto:
```goiasscript
faz_trem processarNome(nome_completo) {
  uai partes é nome_completo.dividir(" ")
  uai primeiro_nome é partes[0]
  uai ultimo_nome é partes[partes.tamanho() menos 1]
  
  faz_favor {
    primeiro: primeiro_nome.pra_maiusculo(),
    ultimo: ultimo_nome.pra_maiusculo(), 
    iniciais: primeiro_nome.letra_em(0) mais ultimo_nome.letra_em(0)
  }
}

uai resultado é processarNome("joão silva")
prosa(resultado) // {primeiro: "JOÃO", ultimo: "SILVA", iniciais: "JS"}
```

### Análise de Dados:
```goiasscript
faz_trem analisarVendas(vendas) {
  uai total é vendas.reduzir((sum, venda) => sum mais venda, 0)
  uai media é total dividido vendas.tamanho()
  uai maior_venda é GoianoMath.maior(...vendas)
  uai vendas_altas é vendas.filtrar(v => v maior_que media)
  
  faz_favor {
    total: total,
    media: GoianoMath.arredondar(media),
    maior: maior_venda,
    acima_da_media: vendas_altas.tamanho()
  }
}

uai vendas_mes é [1500, 2300, 1800, 2700, 1200]
uai analise é analisarVendas(vendas_mes)
prosa("Análise:", analise)
```

### Sistema de Configuração:
```goiasscript
faz_trem criarConfig(opcoes) {
  uai configuracao_padrao é {
    debug: de_jeito_nenhum,
    timeout: 5000,
    linguagem: "pt-BR"
  }
  
  uai config_final é Object.misturar(configuracao_padrao, opcoes)
  
  // Validar configurações
  Object.chaves(config_final).pra_cada(chave => {
    se (config_final[chave] == nada) {
      prosa_aviso("Configuração '" mais chave mais "' está vazia!")
    }
  })
  
  faz_favor config_final
}

uai minha_config é criarConfig({
  debug: certeza,
  api_url: "https://api.exemplo.com"
})
```

---

## 🚀 **Vantagens dos Métodos Goianos**

### ✅ **Linguagem Verdadeiramente Independente:**
- Não depende de sintaxe JavaScript
- Métodos com nomes em português brasileiro
- Terminologia goiana autêntica

### ✅ **Bloqueio de Métodos Não-Goianos:**
- Força o uso da sintaxe goiana
- Evita mistura com JavaScript
- Warnings automáticos para métodos proibidos

### ✅ **Mais Legível e Natural:**
- `nome.pra_maiusculo()` vs `nome.toUpperCase()`
- `numeros.mapear()` vs `numeros.map()`
- `GoianoMath.sorteio()` vs `Math.random()`

### ✅ **Tipagem Goiana:**
- Tipos em português: `texto`, `numero`, `lista`, `coisa`
- Valores goianos: `certeza`, `de_jeito_nenhum`, `nada`

---

## 🔥 **Resultado:**

**GoiásScript v2.0 agora é uma linguagem de programação verdadeiramente goiana e independente!** 🇧🇷

Todos os métodos JavaScript foram substituídos por equivalentes goianos, criando uma experiência de programação 100% autêntica em português brasileiro com terminologia goiana.

---

*"Agora sim, sô! GoiásScript virou linguagem de verdade!" 🎉*