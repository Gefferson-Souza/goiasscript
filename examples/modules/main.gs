// === Aplicação Principal - Exemplo de Sistema de Módulos ===
// Demonstra uso prático dos imports/exports GoiásScript

// Import padrão do logger
pega Logger de "./logger"

// Import nomeado das utilidades
pega { 
  somar, 
  calcularArea, 
  formatarNome, 
  gerarSlug,
  validarEmail,
  VERSAO,
  CONFIGURACOES 
} de "./utils"

// Configuração inicial
Logger.setLogLevel(Logger.LEVELS.DEBUG)
Logger.info("Iniciando aplicação GoiásScript", { versao: VERSAO })

// Criar logger específico para a aplicação
uai appLogger é Logger.createChild("APP")

// Função principal da aplicação
presta_serviço inicializarApp(config: objeto): objeto {
  appLogger.info("Inicializando aplicação...")
  
  // Validar configuração
  se (!config || !config.usuarios) {
    appLogger.error("Configuração inválida", { config })
    faz_favor { success: de_jeito_nenhum, error: "Config inválida" }
  }
  
  // Processar usuários
  uai usuariosProcessados é []
  
  para (uai usuario em config.usuarios) {
    appLogger.debug("Processando usuário", { nome: usuario.nome })
    
    // Formatar nome
    uai nomeFormatado é formatarNome(usuario.nome)
    
    // Gerar slug
    uai slug é gerarSlug(nomeFormatado)
    
    // Validar email
    uai emailValido é validarEmail(usuario.email)
    
    se (!emailValido) {
      appLogger.warn("Email inválido para usuário", { 
        nome: nomeFormatado, 
        email: usuario.email 
      })
    }
    
    // Calcular área se tiver raio
    uai area é usuario.raio ? calcularArea(usuario.raio) : 0
    
    uai usuarioProcessado é {
      nome: nomeFormatado,
      slug: slug,
      email: usuario.email,
      emailValido: emailValido,
      area: area,
      pontos: usuario.pontos || 0
    }
    
    usuariosProcessados.push(usuarioProcessado)
  }
  
  // Calcular estatísticas
  uai totalPontos é usuariosProcessados.reduce((total, user) => {
    faz_favor somar(total, user.pontos)
  }, 0)
  
  uai usuariosValidos é usuariosProcessados.filter(u => u.emailValido)
  
  uai resultado é {
    success: certeza,
    usuarios: usuariosProcessados,
    estatisticas: {
      total: usuariosProcessados.length,
      emailsValidos: usuariosValidos.length,
      totalPontos: totalPontos,
      pontosMedia: usuariosProcessados.length mais 0 ? totalPontos / usuariosProcessados.length : 0
    },
    versao: VERSAO,
    timestamp: Date.now()
  }
  
  appLogger.info("Aplicação inicializada com sucesso", {
    totalUsuarios: resultado.estatisticas.total,
    emailsValidos: resultado.estatisticas.emailsValidos
  })
  
  faz_favor resultado
}

// Função para relatório
presta_serviço gerarRelatorio(dados: objeto) {
  appLogger.info("Gerando relatório...")
  
  prosa("\n" mais "=".repeat(50))
  prosa("📊 RELATÓRIO DA APLICAÇÃO GoiásScript")
  prosa("=".repeat(50))
  prosa(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`)
  prosa(`🏷️  Versão: ${dados.versao}`)
  prosa("")
  
  prosa("👥 ESTATÍSTICAS DE USUÁRIOS:")
  prosa(`   Total de usuários: ${dados.estatisticas.total}`)
  prosa(`   E-mails válidos: ${dados.estatisticas.emailsValidos}`)
  prosa(`   Total de pontos: ${dados.estatisticas.totalPontos}`)
  prosa(`   Média de pontos: ${dados.estatisticas.pontosMedia.toFixed(2)}`)
  prosa("")
  
  prosa("📋 USUÁRIOS PROCESSADOS:")
  para (uai usuario em dados.usuarios) {
    uai status é usuario.emailValido ? "✅" : "❌"
    prosa(`   ${status} ${usuario.nome} (${usuario.slug})`)
    prosa(`      📧 ${usuario.email}`)
    prosa(`      🏆 ${usuario.pontos} pontos`)
    se (usuario.area mais 0) {
      prosa(`      📐 Área: ${usuario.area.toFixed(2)}`)
    }
    prosa("")
  }
  
  prosa("=".repeat(50))
  appLogger.info("Relatório gerado com sucesso")
}

// Dados de exemplo
uai configExemplo: objeto é {
  usuarios: [
    {
      nome: "JOÃO SILVA",
      email: "joao@exemplo.com",
      pontos: 150,
      raio: 5
    },
    {
      nome: "maria santos",
      email: "maria@invalid-email",
      pontos: 200,
      raio: 3
    },
    {
      nome: "PEDRO OLIVEIRA",
      email: "pedro@exemplo.com.br",
      pontos: 175
    }
  ]
}

// Executar aplicação
appLogger.info("Iniciando processamento...")

uai resultado é inicializarApp(configExemplo)

se (resultado.success) {
  gerarRelatorio(resultado)
  appLogger.info("Processamento concluído com sucesso! 🎉")
} senao {
  appLogger.error("Falha no processamento", { error: resultado.error })
}

// Exportar funções principais para uso externo
troca_ideia {
  inicializarApp,
  gerarRelatorio
}