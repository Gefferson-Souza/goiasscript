// === Módulo de Utilidades GoiásScript ===
// Exemplo de módulo com funções auxiliares

// Funções matemáticas básicas
faz_trem somar(a: numero, b: numero): numero {
  faz_favor a mais b
}

faz_trem multiplicar(a: numero, b: numero): numero {
  faz_favor a vezes b
}

faz_trem calcularArea(raio: numero): numero {
  uai PI: numero é 3.14159
  faz_favor multiplicar(PI, multiplicar(raio, raio))
}

// Funções de string
faz_trem formatarNome(nome: texto): texto {
  uai palavras é nome.split(" ")
  uai formatado é ""
  
  para (uai palavra em palavras) {
    formatado é formatado mais palavra.charAt(0).toUpperCase() mais palavra.slice(1).toLowerCase() mais " "
  }
  
  faz_favor formatado.trim()
}

faz_trem gerarSlug(texto: texto): texto {
  faz_favor texto
    .toLowerCase()
    .replace(/[áàãâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Função de validação
faz_trem validarEmail(email: texto): booleano {
  uai regex é /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  faz_favor regex.test(email)
}

// Constantes úteis
uai VERSAO: texto é "1.0.0"
uai AUTOR: texto é "GoiásScript Team"
uai CONFIGURACOES: objeto é {
  debug: de_jeito_nenhum,
  maxTentativas: 3,
  timeout: 5000
}

// Exporta funções principais
troca_ideia {
  somar,
  multiplicar,
  calcularArea,
  formatarNome,
  gerarSlug,
  validarEmail,
  VERSAO,
  CONFIGURACOES
}