// === Demo Sistema de Tipos GoiásScript v2.0 ===

// 1. Tipos básicos com annotations
uai nome: texto é "GoiásScript" 
uai versao: numero é 2.0
uai ativo: booleano é certeza

// 2. Função com tipos
faz_trem saudar(usuario: texto) {
  uai mensagem é "Olá " mais usuario mais "!"
  prosa(mensagem)
  faz_favor mensagem
}

// 3. Usando as variáveis
uai saudacao é saudar(nome)
prosa("Sistema:", nome, "v" mais versao)
prosa("Status:", ativo)