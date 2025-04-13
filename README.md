# GoiásScript: Documentação Oficial

<img src="/goiasscript-language/goiasscript/icons/goiasscript-dark.png" alt="GoiásScript Logo" style="display: block; margin: 0 auto; height: 300px; width: 500px;">

**Versão:** 1.0.0  
**Data:** 2025-04-13  
**Autor:** Gefferson-Souza

---

## Sumário

1. [Introdução](#1-introdução)
2. [Instalação](#2-instalação)
3. [Sintaxe Básica](#3-sintaxe-básica)
4. [Tipos de Dados](#4-tipos-de-dados)
5. [Operadores](#5-operadores)
6. [Estruturas de Controle](#6-estruturas-de-controle)
7. [Funções](#7-funções)
8. [Programação Assíncrona](#8-programação-assíncrona)
9. [Manipulação de Erros](#9-manipulação-de-erros)
10. [Estruturas de Dados](#10-estruturas-de-dados)
11. [Exemplos Práticos](#11-exemplos-práticos)
12. [Referência de API](#12-referência-de-api)
13. [Melhores Práticas](#13-melhores-práticas)
14. [Perguntas Frequentes (FAQ)](#14-perguntas-frequentes-faq)

---

## 1. Introdução

GoiásScript é uma linguagem de programação baseada no dialeto goiano do interior do Brasil que compila para JavaScript. Foi projetada para ser uma forma divertida e culturalmente relevante de aprender e praticar programação, especialmente para pessoas da região Centro-Oeste do Brasil.

### 1.1 Filosofia da Linguagem

GoiásScript combina expressões típicas do vocabulário goiano com a estrutura e poder do JavaScript moderno, incluindo características avançadas como programação assíncrona, manipulação de promessas, e estruturas de dados complexas.

### 1.2 Características Principais

- Sintaxe familiar para falantes do dialeto goiano
- Compilação para JavaScript padrão
- Suporte completo a recursos modernos como async/await
- Integração com o ecossistema Node.js e npm
- Extensão para Visual Studio Code com syntax highlighting

---

## 2. Instalação

### 2.1 Pré-requisitos

- Node.js (versão 14.0.0 ou superior)
- npm (normalmente instalado com Node.js)

### 2.2 Instalação Global

```bash
# Clonar o repositório
git clone https://github.com/Gefferson-Souza/goiasscript.git

# Entrar no diretório
cd goiasscript

# Instalar globalmente
npm install -g .
```

### 2.3 Configuração do Editor (VS Code)

1. Instale a extensão GoiásScript
   ```bash
   code --install-extension goiasscript-1.0.0.vsix
   ```
   Ou instale pela interface do VS Code: Extensions → Install from VSIX...

2. Verifique se os arquivos `.gs` estão sendo reconhecidos pelo VS Code

### 2.4 Verificação da Instalação

Crie um arquivo `teste.gs`:

```javascript
// Meu primeiro programa em GoiásScript
prosa("Uai, GoiásScript tá funcionando!");
```

Execute o arquivo:

```bash
goiasscript teste.gs
```

---

## 3. Sintaxe Básica

### 3.1 Estrutura de um Programa

Um programa GoiásScript é composto por declarações, expressões e comentários. Assim como JavaScript, cada instrução geralmente termina com um ponto e vírgula (`;`).

```javascript
// Comentário de linha única

/*
  Comentário de 
  múltiplas linhas
*/

// Declaração de variável
uai mensagem = "Olá, mundo!";

// Exibindo mensagem no console
prosa(mensagem);
```

### 3.2 Declaração de Variáveis

GoiásScript possui dois tipos de declarações de variáveis:

```javascript
// Constante (não pode ser reatribuída)
uai nome = "Gefferson-Souza";

// Variável (pode ser reatribuída)
trem contador = 0;
contador = contador mais 1;
```

### 3.3 Output para o Console

```javascript
// Console.log equivalente
prosa("Mensagem para o console");

// Console.error equivalente
reclama("Algo deu errado!");
```

---

## 4. Tipos de Dados

### 4.1 Tipos Primitivos

- **String**: Texto entre aspas
  ```javascript
  uai texto = "Isso é uma string";
  ```

- **Number**: Valores numéricos
  ```javascript
  uai inteiro = 42;
  uai decimal = 3.14;
  ```

- **Boolean**: Valores de verdadeiro ou falso
  ```javascript
  uai verdadeiro = certeza;
  uai falso = de_jeito_nenhum;
  ```

- **Null e Undefined**:
  ```javascript
  uai nada = vazio;        // null
  uai indefinido = sei_lá; // undefined
  ```

### 4.2 Estruturas de Dados

- **Arrays**:
  ```javascript
  uai frutas = ["pequi", "guariroba", "mangaba"];
  ```

- **Objetos**:
  ```javascript
  uai pessoa = {
    nome: "João",
    idade: 30,
    cidade: "Goiânia"
  };
  ```

---

## 5. Operadores

### 5.1 Operadores Aritméticos

```javascript
uai soma = 5 mais 3;        // 8
uai subtracao = 10 menos 4; // 6
uai produto = 3 vezes 4;    // 12
uai quociente = 10 dividido 2; // 5
uai resto = 10 sobrou 3;    // 1 (resto da divisão)
```

### 5.2 Operadores de Comparação

```javascript
// Igualdade
se_ocê_quiser (a é_igualim b) { /* código */ }

// Diferença
se_ocê_quiser (a diferente b) { /* código */ }

// Maior que
se_ocê_quiser (a maior_que b) { /* código */ }

// Menor que
se_ocê_quiser (a menor_que b) { /* código */ }

// Maior ou igual a
se_ocê_quiser (a pelo_menos b) { /* código */ }

// Menor ou igual a
se_ocê_quiser (a no_máximo b) { /* código */ }
```

### 5.3 Operadores Lógicos

```javascript
// AND lógico
se_ocê_quiser (condição1 e_mais condição2) { /* código */ }

// OR lógico
se_ocê_quiser (condição1 ou_então condição2) { /* código */ }

// NOT lógico
se_ocê_quiser (num_é condição) { /* código */ }
```

---

## 6. Estruturas de Controle

### 6.1 Condicional (If/Else)

```javascript
se_ocê_quiser (idade maior_que 18) {
  prosa("Você é maior de idade");
} se_num_for (idade é_igualim 18) {
  prosa("Você acabou de atingir a maioridade");
} se_não {
  prosa("Você é menor de idade");
}
```

### 6.2 Loop For

```javascript
vai_indo (trem i = 0; i menor_que 5; i = i mais 1) {
  prosa("Número: " + i);
}
```

### 6.3 Loop While

```javascript
trem contador = 0;
enquanto_tiver (contador menor_que 5) {
  prosa("Contador: " + contador);
  contador = contador mais 1;
}
```

### 6.4 For...in e For...of

```javascript
// For...in (iterar sobre propriedades)
uai pessoa = { nome: "José", idade: 45, cidade: "Goiânia" };
vai_indo (trem prop in pessoa) {
  prosa(prop + ": " + pessoa[prop]);
}

// For...of (iterar sobre valores)
uai frutas = ["pequi", "guariroba", "mangaba"];
vai_indo (trem fruta of frutas) {
  prosa("Fruta: " + fruta);
}
```

### 6.5 Break e Continue

```javascript
vai_indo (trem i = 0; i menor_que 10; i = i mais 1) {
  se_ocê_quiser (i é_igualim 5) {
    continua_aí; // Pula para a próxima iteração
  }
  
  se_ocê_quiser (i é_igualim 8) {
    para_com_isso; // Sai do loop
  }
  
  prosa("Número: " + i);
}
```

---

## 7. Funções

### 7.1 Declaração de Função

```javascript
presta_serviço soma(a, b) {
  faz_favor a mais b;
}

uai resultado = soma(5, 3);
prosa("Resultado: " + resultado); // Resultado: 8
```

### 7.2 Funções com Parâmetros Padrão

```javascript
presta_serviço saudar(nome, mensagem = "Bão demais da conta!") {
  faz_favor mensagem + " " + nome;
}

prosa(saudar("Gefferson-Souza")); // Bão demais da conta! Gefferson-Souza
```

### 7.3 Arrow Functions

```javascript
uai dobrar = (x) => x vezes 2;
prosa(dobrar(5)); // 10
```

### 7.4 Métodos de Objeto

```javascript
uai calculadora = {
  valor: 0,
  
  adicionar: presta_serviço(x) {
    ocê.valor = ocê.valor mais x;
    faz_favor ocê;
  },
  
  subtrair: presta_serviço(x) {
    ocê.valor = ocê.valor menos x;
    faz_favor ocê;
  }
};

calculadora.adicionar(5).subtrair(2);
prosa(calculadora.valor); // 3
```

---

## 8. Programação Assíncrona

### 8.1 Callbacks

```javascript
presta_serviço buscarDados(callback) {
  setTimeout(() => {
    uai dados = { nome: "Dados importantes" };
    callback(vazio, dados);
  }, 1000);
}

buscarDados((erro, resultado) => {
  se_ocê_quiser (erro) {
    reclama("Erro: " + erro);
  } se_não {
    prosa("Dados recebidos: " + resultado.nome);
  }
});
```

### 8.2 Promises

```javascript
presta_serviço buscarDados() {
  faz_favor faz_um promessa((resolve_aí, rejeita_isso) => {
    setTimeout(() => {
      uai sucesso = certeza;
      
      se_ocê_quiser (sucesso) {
        resolve_aí({ nome: "Dados importantes" });
      } se_não {
        rejeita_isso("Falha ao buscar dados");
      }
    }, 1000);
  });
}

buscarDados()
  .quando_resolver(dados => {
    prosa("Dados recebidos: " + dados.nome);
  })
  .se_der_pobrema(erro => {
    reclama("Erro: " + erro);
  });
```

### 8.3 Async/Await

```javascript
vai_na_frente_presta_serviço processarDados() {
  tenta_aí {
    prosa("Iniciando busca de dados...");
    
    uai dados = espera_um_cadim buscarDados();
    prosa("Dados recebidos: " + dados.nome);
    
    uai dadosProcessados = espera_um_cadim processamento(dados);
    prosa("Processamento concluído!");
    
    faz_favor dadosProcessados;
    
  } se_der_ruim (erro) {
    reclama("Erro durante o processamento: " + erro);
    faz_favor vazio;
  }
}

vai_na_frente_presta_serviço processamento(dados) {
  faz_favor faz_um promessa(resolve_aí => {
    setTimeout(() => {
      dados.processado = certeza;
      resolve_aí(dados);
    }, 500);
  });
}

// Executando a função assíncrona
processarDados();
```

### 8.4 Promise.all

```javascript
vai_na_frente_presta_serviço buscarVariasInformacoes() {
  uai promessas = [
    buscarUsuario(),
    buscarProdutos(),
    buscarDados()
  ];
  
  prosa("Buscando informações em paralelo...");
  uai resultados = espera_um_cadim promessa.all(promessas);
  
  prosa("Todas as informações foram carregadas!");
  faz_favor {
    usuario: resultados[0],
    produtos: resultados[1],
    dados: resultados[2]
  };
}
```

---

## 9. Manipulação de Erros

### 9.1 Try/Catch/Finally

```javascript
tenta_aí {
  // Código que pode gerar um erro
  uai resultado = funcaoQuePoderiaFalhar();
  prosa("Resultado: " + resultado);
  
} se_der_ruim (erro) {
  // Tratamento de erros
  reclama("Ocorreu um erro: " + erro.message);
  
} por_fim {
  // Código que sempre será executado
  prosa("Processamento finalizado");
}
```

### 9.2 Lançando Erros

```javascript
presta_serviço dividir(a, b) {
  se_ocê_quiser (b é_igualim 0) {
    vixe("Não pode dividir por zero!");
  }
  
  faz_favor a dividido b;
}

tenta_aí {
  uai resultado = dividir(10, 0);
} se_der_ruim (erro) {
  reclama("Erro: " + erro);
}
```

---

## 10. Estruturas de Dados

### 10.1 Arrays

```javascript
// Criando um array
uai frutas = ["pequi", "guariroba", "mangaba"];

// Acessando elementos
prosa("Primeira fruta: " + frutas[0]);

// Adicionando elementos
frutas.push("cajá");

// Removendo elementos
frutas.pop();

// Iterando sobre um array
vai_indo (trem i = 0; i menor_que frutas.length; i = i mais 1) {
  prosa("Fruta " + i + ": " + frutas[i]);
}
```

### 10.2 Objetos

```javascript
// Criando um objeto
uai pessoa = {
  nome: "João",
  idade: 30,
  cidade: "Goiânia",
  
  apresentar: presta_serviço() {
    faz_favor "Olá, meu nome é " + ocê.nome + " e tenho " + ocê.idade + " anos.";
  }
};

// Acessando propriedades
prosa(pessoa.nome);
prosa(pessoa["cidade"]);

// Adicionando ou modificando propriedades
pessoa.profissao = "Fazendeiro";
pessoa.idade = 31;

// Chamando métodos
prosa(pessoa.apresentar());
```

### 10.3 Map e Set

```javascript
// Map para armazenar pares chave-valor
uai mapa = faz_um Map();
mapa.set("nome", "Gefferson-Souza");
mapa.set("cidade", "Goiânia");

prosa(mapa.get("nome")); // Gefferson-Souza

// Set para armazenar valores únicos
uai conjunto = faz_um Set();
conjunto.add("pequi");
conjunto.add("guariroba");
conjunto.add("pequi"); // Duplicado, será ignorado

prosa(conjunto.size); // 2
```

---

## 11. Exemplos Práticos

### 11.1 Calculadora de Médias

```javascript
// Calculadora de médias em GoiásScript
presta_serviço calculaMedia(notas) {
  se_ocê_quiser (notas.length é_igualim 0) {
    faz_favor 0;
  }
  
  uai soma = 0;
  vai_indo (trem i = 0; i menor_que notas.length; i = i mais 1) {
    soma = soma mais notas[i];
  }
  
  faz_favor soma dividido notas.length;
}

uai notasDoAluno = [8.5, 7.0, 9.5, 6.5];
uai media = calculaMedia(notasDoAluno);

prosa("A média das notas é: " + media);

se_ocê_quiser (media pelo_menos 7) {
  prosa("Aluno aprovado!");
} se_não {
  prosa("Aluno reprovado.");
}
```

### 11.2 API de Clima (Assíncrono)

```javascript
// Simulação de uma API de clima usando GoiásScript assíncrono
presta_serviço simularRequisicaoAPI(cidade) {
  faz_favor faz_um promessa((resolve_aí, rejeita_isso) => {
    prosa("Buscando clima para: " + cidade);
    
    setTimeout(() => {
      // Simulando dados da API
      se_ocê_quiser (cidade) {
        resolve_aí({
          cidade: cidade,
          temperatura: Math.floor(Math.random() * 30) mais 10,
          condicao: ["ensolarado", "nublado", "chuvoso"][Math.floor(Math.random() * 3)]
        });
      } se_não {
        rejeita_isso("Cidade inválida");
      }
    }, 1500);
  });
}

vai_na_frente_presta_serviço mostrarClima(cidade) {
  tenta_aí {
    prosa("Verificando clima para " + cidade + "...");
    
    uai dadosClima = espera_um_cadim simularRequisicaoAPI(cidade);
    
    prosa("\n=== Previsão do Tempo ===");
    prosa("Cidade: " + dadosClima.cidade);
    prosa("Temperatura: " + dadosClima.temperatura + "°C");
    prosa("Condição: " + dadosClima.condicao);
    
  } se_der_ruim (erro) {
    reclama("Erro ao buscar dados do clima: " + erro);
  }
}

// Executando
mostrarClima("Goiânia");
```

### 11.3 Gerenciador de Tarefas

```javascript
// Gerenciador de tarefas em GoiásScript
uai GerenciadorTarefas = {
  tarefas: [],
  
  adicionarTarefa: presta_serviço(descricao, prioridade = "média") {
    ocê.tarefas.push({
      id: ocê.tarefas.length mais 1,
      descricao: descricao,
      prioridade: prioridade,
      concluida: de_jeito_nenhum,
      dataCriacao: faz_um Date().toISOString()
    });
    
    prosa("Tarefa adicionada com sucesso!");
    faz_favor ocê.tarefas[ocê.tarefas.length menos 1];
  },
  
  marcarConcluida: presta_serviço(id) {
    uai tarefa = ocê.tarefas.find(t => t.id é_igualim id);
    
    se_ocê_quiser (tarefa) {
      tarefa.concluida = certeza;
      prosa("Tarefa #" + id + " marcada como concluída!");
    } se_não {
      reclama("Tarefa #" + id + " não encontrada!");
    }
  },
  
  listarTarefas: presta_serviço(filtro = "todas") {
    prosa("\n=== Lista de Tarefas (" + filtro + ") ===");
    
    uai tarefasFiltradas = ocê.tarefas;
    
    se_ocê_quiser (filtro é_igualim "pendentes") {
      tarefasFiltradas = ocê.tarefas.filter(t => t.concluida é_igualim de_jeito_nenhum);
    } se_num_for (filtro é_igualim "concluídas") {
      tarefasFiltradas = ocê.tarefas.filter(t => t.concluida é_igualim certeza);
    }
    
    se_ocê_quiser (tarefasFiltradas.length é_igualim 0) {
      prosa("Nenhuma tarefa encontrada.");
      faz_favor;
    }
    
    vai_indo (trem i = 0; i menor_que tarefasFiltradas.length; i = i mais 1) {
      uai t = tarefasFiltradas[i];
      prosa(
        (t.concluida ? "[X]" : "[ ]") + " " +
        "#" + t.id + " " +
        t.descricao + " " +
        "(Prioridade: " + t.prioridade + ")"
      );
    }
  }
};

// Usando o gerenciador
GerenciadorTarefas.adicionarTarefa("Comprar pequi", "alta");
GerenciadorTarefas.adicionarTarefa("Fazer pamonha", "média");
GerenciadorTarefas.adicionarTarefa("Visitar Pirenópolis", "baixa");

GerenciadorTarefas.listarTarefas();
GerenciadorTarefas.marcarConcluida(1);
GerenciadorTarefas.listarTarefas("concluídas");
GerenciadorTarefas.listarTarefas("pendentes");
```

---

## 12. Referência de API

### 12.1 Palavras-chave da Linguagem

| GoiásScript        | JavaScript       | Descrição                      |
|--------------------|------------------|--------------------------------|
| `uai`              | `const`          | Declaração de constante        |
| `trem`             | `var`            | Declaração de variável         |
| `é`                | `=`              | Atribuição                     |
| `presta_serviço`   | `function`       | Declaração de função           |
| `faz_favor`        | `return`         | Retorno de função              |
| `se_ocê_quiser`    | `if`             | Condicional if                 |
| `se_num_for`       | `else if`        | Condicional else if            |
| `se_não`           | `else`           | Condicional else               |
| `vai_indo`         | `for`            | Loop for                       |
| `enquanto_tiver`   | `while`          | Loop while                     |
| `para_com_isso`    | `break`          | Interrompe um loop             |
| `continua_aí`      | `continue`       | Pula para próxima iteração     |
| `ocê`              | `this`           | Referência ao objeto atual     |
| `prosa`            | `console.log`    | Saída para console             |
| `reclama`          | `console.error`  | Erro para console              |
| `vai_na_frente`    | `async`          | Define função assíncrona       |
| `espera_um_cadim`  | `await`          | Aguarda uma Promise            |
| `tenta_aí`         | `try`            | Bloco try                      |
| `se_der_ruim`      | `catch`          | Captura erro (catch)           |
| `por_fim`          | `finally`        | Bloco finally                  |
| `e_mais`           | `&&`             | Operador AND lógico            |
| `ou_então`         | `||`             | Operador OR lógico             |
| `num_é`            | `!`              | Operador NOT lógico            |
| `faz_um`           | `new`            | Cria nova instância            |
| `vixe`             | `throw new Error`| Lança um erro                  |

### 12.2 Comparadores

| GoiásScript     | JavaScript | Descrição                  |
|-----------------|------------|----------------------------|
| `é_igualim`     | `===`      | Igualdade estrita          |
| `diferente`     | `!==`      | Diferença estrita          |
| `maior_que`     | `>`        | Maior que                  |
| `menor_que`     | `<`        | Menor que                  |
| `pelo_menos`    | `>=`       | Maior ou igual a           |
| `no_máximo`     | `<=`       | Menor ou igual a           |

### 12.3 Operadores Aritméticos

| GoiásScript  | JavaScript | Descrição              |
|--------------|------------|------------------------|
| `mais`       | `+`        | Adição                 |
| `menos`      | `-`        | Subtração              |
| `vezes`      | `*`        | Multiplicação          |
| `dividido`   | `/`        | Divisão                |
| `sobrou`     | `%`        | Resto da divisão       |

### 12.4 Valores Constantes

| GoiásScript        | JavaScript   | Descrição          |
|--------------------|--------------|-------------------|
| `certeza`          | `true`       | Valor verdadeiro  |
| `de_jeito_nenhum`  | `false`      | Valor falso       |
| `vazio`            | `null`       | Nulo              |
| `sei_lá`           | `undefined`  | Indefinido        |

---

## 13. Melhores Práticas

### 13.1 Nomenclatura

- Use nomes descritivos para variáveis e funções
- Mantenha consistência no estilo de nomenclatura
- Prefira `uai` para constantes e `trem` apenas para variáveis que serão reatribuídas

```javascript
// Bom
uai precoUnitario = 29.90;
uai nomeCompleto = "José Silva";

// Quando precisar reatribuir
trem contador = 0;
contador = contador mais 1;
```

### 13.2 Organização de Código

- Organize o código em funções pequenas e específicas
- Agrupe funcionalidades relacionadas
- Use comentários para explicar partes complexas

```javascript
// Módulo de cálculo de preços
uai CalculadoraPrecos = {
  // Calcula o preço com desconto
  calcularDesconto: presta_serviço(preco, percentualDesconto) {
    uai desconto = preco vezes (percentualDesconto dividido 100);
    faz_favor preco menos desconto;
  },
  
  // Calcula o preço final com impostos
  calcularComImpostos: presta_serviço(preco, percentualImposto) {
    uai imposto = preco vezes (percentualImposto dividido 100);
    faz_favor preco mais imposto;
  },
  
  // Calcula o preço final com desconto e impostos
  calcularPrecoFinal: presta_serviço(
    preco, 
    percentualDesconto = 0, 
    percentualImposto = 0
  ) {
    uai precoComDesconto = ocê.calcularDesconto(preco, percentualDesconto);
    faz_favor ocê.calcularComImpostos(precoComDesconto, percentualImposto);
  }
};
```

### 13.3 Programação Assíncrona

- Prefira `async/await` em vez de callbacks aninhados
- Sempre trate erros em código assíncrono com `tenta_aí/se_der_ruim`
- Use `promessa.all` para operações paralelas

```javascript
// Correto
vai_na_frente_presta_serviço carregarDados() {
  tenta_aí {
    // Carregar dados em paralelo
    uai [usuarios, produtos] = espera_um_cadim promessa.all([
      buscarUsuarios(),
      buscarProdutos()
    ]);
    
    faz_favor { usuarios, produtos };
  } se_der_ruim (erro) {
    reclama("Erro ao carregar dados:", erro);
    vixe(erro); // Re-lançar ou tratar adequadamente
  }
}

// Evitar (callback hell)
buscarUsuarios((erroUsuarios, usuarios) => {
  se_ocê_quiser (erroUsuarios) {
    // Tratamento de erro
    faz_favor;
  }
  
  buscarProdutos((erroProdutos, produtos) => {
    se_ocê_quiser (erroProdutos) {
      // Tratamento de erro
      faz_favor;
    }
    
    // Processamento com os dados
  });
});
```

### 13.4 Manipulação de Erros

- Use blocos `tenta_aí/se_der_ruim` para capturar e tratar erros
- Forneça mensagens de erro descritivas
- Evite engolir erros sem tratamento adequado

```javascript
// Bom
tenta_aí {
  uai dados = JSON.parse(textoJson);
  processarDados(dados);
} se_der_ruim (erro) {
  reclama("Erro ao processar JSON: " + erro.message);
  // Tratamento adequado do erro
}

// Evitar
tenta_aí {
  uai dados = JSON.parse(textoJson);
  processarDados(dados);
} se_der_ruim (erro) {
  // Erro é ignorado sem tratamento adequado
}
```

---

## 14. Perguntas Frequentes (FAQ)

### 14.1 O que é GoiásScript?

GoiásScript é uma linguagem de programação baseada no dialeto goiano do interior que compila para JavaScript. Foi criada como uma forma divertida e culturalmente relevante de programar, especialmente para pessoas da região Centro-Oeste do Brasil.

### 14.2 GoiásScript é uma linguagem séria para uso em produção?

GoiásScript pode ser usado para projetos reais, mas seu propósito principal é educacional e recreativo. Por compilar para JavaScript, o código resultante pode ser tão robusto quanto JavaScript padrão, mas considere fatores como manutenção a longo prazo e familiaridade da equipe antes de usá-lo em um ambiente de produção.

### 14.3 Como contribuir para o GoiásScript?

Você pode contribuir com o GoiásScript através do repositório no GitHub:
1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcao`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova função'`)
4. Faça push para a branch (`git push origin feature/nova-funcao`)
5. Abra um Pull Request

### 14.4 Posso usar GoiásScript com outras bibliotecas JavaScript?

Sim! Como o GoiásScript compila para JavaScript padrão, você pode usar qualquer biblioteca ou framework JavaScript existente com ele. Basta importar as bibliotecas necessárias e usá-las normalmente no seu código GoiásScript.

### 14.5 Como debugar código GoiásScript?

Para depurar código GoiásScript:
1. Use o parâmetro `--compiled` para ver o JavaScript gerado
2. Adicione instruções `prosa()` para debug
3. O código compilado mantém a estrutura próxima ao original, facilitando o mapeamento entre os dois

---

## Licença

Esta documentação e o projeto GoiásScript estão licenciados sob a licença MIT.

Copyright © 2025 Gefferson-Souza

---

*"Programar é trem bão demais da conta!"*

---

## Histórico de Versões

- **v1.0.0** (2025-04-13) - Lançamento inicial
  - Suporte completo à sintaxe básica
  - Programação assíncrona com async/await
  - Extensão VS Code

---

_Documentação atualizada em: 2025-04-13 05:18:31_
