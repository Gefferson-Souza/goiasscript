// === Demonstração do Sistema de Tipos GoiásScript v2.0 ===

// 1. Inferência automática de tipos
uai nome é "GoiásScript"
uai versao é 2.0 
uai ativo é certeza
uai recursos é ["tipos", "modules", "lsp"]

// 2. Type annotations explícitas
uai usuario: texto é "Gefferson"
uai idade: numero é 25
uai configuracoes: objeto é { 
  debug: certeza,
  tema: "escuro",
  maxConnections: 100
}

// 3. Funções com tipos
presta_serviço calcular(a: numero, b: numero) {
  uai resultado: numero é a mais b
  faz_favor resultado
}

presta_serviço saudar(nome: texto, idade: numero) {
  uai mensagem: texto é "Oi " mais nome mais ", ocê tem " mais idade mais " anos!"
  prosa(mensagem)
  faz_favor mensagem
}

// 4. Async functions com tipos
vai_na_frente_presta_serviço buscarDados(url: texto) {
  uai response é espera_um_cadim fetch(url)
  uai dados: objeto é espera_um_cadim response.json()
  faz_favor dados
}

// 5. Uso das funções
uai soma: numero é calcular(10, 20)
uai saudacao: texto é saudar(usuario, idade)

prosa("=== Resultados ===")
prosa("Nome:", nome, "v" mais versao)
prosa("Soma:", soma)
prosa("Saudação:", saudacao)
prosa("Recursos:", recursos)
prosa("Configurações:", configuracoes)