// GoiásScript JIT Compiler Demo
// Este exemplo demonstra o JIT Compiler em ação

// Função que será otimizada pelo JIT após múltiplas execuções
faz_trem calcular_fibonacci(n: numero): numero {
  se (n <= 1) {
    faz_favor n
  }
  faz_favor calcular_fibonacci(n - 1) + calcular_fibonacci(n - 2)
}

// Loop que será desenrolado pelo JIT
faz_trem processar_array(dados: lista): lista {
  uai resultado: lista é []
  
  pra (uai i é 0; i < 4; i++) {
    resultado.empurrar(dados[i] * 2 + 1)
  }
  
  faz_favor resultado
}

// Operações matemáticas que serão otimizadas
faz_trem operacoes_simples(): numero {
  uai a: numero é 10 + 20    // Será otimizado para 30
  uai b: numero é 5 * 4      // Será otimizado para 20
  uai c: numero é GoianoMath.maior(a, b)  // Será inlinada
  
  faz_favor c
}

// Código principal para testar JIT
prosa("🔥 Demonstração do JIT Compiler GoiásScript")

// Executar múltiplas vezes para ativar JIT
pra (uai i é 0; i < 10; i++) {
  uai resultado: numero é calcular_fibonacci(8)
  prosa("Fibonacci(8) =", resultado)
}

uai dados: lista é [1, 2, 3, 4, 5]
uai processado: lista é processar_array(dados)
prosa("Array processado:", processado)

uai operacao: numero é operacoes_simples()
prosa("Operação otimizada:", operacao)