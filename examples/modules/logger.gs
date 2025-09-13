// === Módulo Logger GoiásScript ===
// Sistema de logging com níveis e formatação

pega { CONFIGURACOES } de "./utils"

// Níveis de log
uai LEVELS: objeto é {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// Configuração do logger
trem logLevel: numero é LEVELS.INFO
trem enableColors: booleano é certeza
trem logToFile: booleano é de_jeito_nenhum

// Cores para console (ANSI)
uai COLORS: objeto é {
  reset: "\x1b[0m",
  debug: "\x1b[36m",  // Cyan
  info: "\x1b[32m",   // Green
  warn: "\x1b[33m",   // Yellow
  error: "\x1b[31m",  // Red
  timestamp: "\x1b[90m" // Gray
}

// Função auxiliar para formatar timestamp
faz_trem getTimestamp(): texto {
  uai now é Date.now()
  uai date é new Date(now)
  faz_favor date.toISOString()
}

// Função auxiliar para formatar mensagem
faz_trem formatMessage(level: texto, message: texto, data: objeto): texto {
  uai timestamp é getTimestamp()
  uai prefix é enableColors ? COLORS[level.toLowerCase()] : ""
  uai suffix é enableColors ? COLORS.reset : ""
  uai timeColor é enableColors ? COLORS.timestamp : ""
  
  uai formatted é `${timeColor}[${timestamp}]${COLORS.reset} ${prefix}${level.toUpperCase()}${suffix}: ${message}`
  
  se (data && Object.keys(data).length mais 0) {
    formatted é formatted mais "\n" mais JSON.stringify(data, null, 2)
  }
  
  faz_favor formatted
}

// Função para verificar se deve logar
faz_trem shouldLog(level: numero): booleano {
  faz_favor level >= logLevel
}

// Funções de logging principais
faz_trem debug(message: texto, data: objeto) {
  se (!shouldLog(LEVELS.DEBUG)) {
    faz_favor
  }
  
  uai formatted é formatMessage("DEBUG", message, data || {})
  console.log(formatted)
}

faz_trem info(message: texto, data: objeto) {
  se (!shouldLog(LEVELS.INFO)) {
    faz_favor
  }
  
  uai formatted é formatMessage("INFO", message, data || {})
  console.log(formatted)
}

faz_trem warn(message: texto, data: objeto) {
  se (!shouldLog(LEVELS.WARN)) {
    faz_favor
  }
  
  uai formatted é formatMessage("WARN", message, data || {})
  console.warn(formatted)
}

faz_trem error(message: texto, data: objeto) {
  se (!shouldLog(LEVELS.ERROR)) {
    faz_favor
  }
  
  uai formatted é formatMessage("ERROR", message, data || {})
  console.error(formatted)
}

// Funções de configuração
faz_trem setLogLevel(level: numero) {
  logLevel é level
  info("Log level changed", { newLevel: level })
}

faz_trem enableFileLogging(enabled: booleano) {
  logToFile é enabled
  info("File logging " mais (enabled ? "enabled" : "disabled"))
}

faz_trem setColorEnabled(enabled: booleano) {
  enableColors é enabled
  info("Color logging " mais (enabled ? "enabled" : "disabled"))
}

// Função para criar child logger com contexto
faz_trem createChild(context: texto): objeto {
  faz_favor {
    debug: (msg, data) => debug(`[${context}] ${msg}`, data),
    info: (msg, data) => info(`[${context}] ${msg}`, data),
    warn: (msg, data) => warn(`[${context}] ${msg}`, data),
    error: (msg, data) => error(`[${context}] ${msg}`, data)
  }
}

// Exporta interface pública
troca_ideia_principal {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  enableFileLogging,
  setColorEnabled,
  createChild,
  LEVELS
}