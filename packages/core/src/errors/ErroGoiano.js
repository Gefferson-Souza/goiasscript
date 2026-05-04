/**
 * Classe de erro personalizada em estilo goiano
 * @class ErroGoiano
 * @extends Error
 */
class ErroGoiano extends Error {
  /**
   * @param {string} tipo - Tipo do erro (sintaxe, referencia, tipo, etc.)
   * @param {string} mensagem - Mensagem de erro em português goiano
   * @param {string} dica - Dica para resolver o erro
   * @param {number} linha - Linha onde ocorreu o erro
   * @param {number} coluna - Coluna onde ocorreu o erro
   * @param {string} arquivo - Nome do arquivo onde ocorreu o erro
   */
  constructor(tipo, mensagem, dica, linha, coluna, arquivo) {
    // Mapear tipos de erro para expressões goianas
    const tipoTraduzido = {
      sintaxe: 'sintaxe torta',
      referencia: 'trem que não existe',
      tipo: 'tipo errado de trem',
      execucao: 'execução deu ruim',
      falta_virgula: 'faltou ponto-e-vírgula',
      falta_parentese: 'faltou um parêntese',
      falta_chave: 'faltou uma chave',
      erro_nome: 'nome tá errado',
      divisao_zero: 'dividiu por zero',
      argumento_invalido: 'parâmetro não tá bão',
      promessa_rejeitada: 'promessa não cumprida',
      importacao: 'importação deu problema',
      interno: 'algo deu errado no sistema',
    }[tipo] || 'trem desconhecido';
    
    // Construir a mensagem de erro em estilo goiano
    let mensagemCompleta = `Ô gente! Deu ${tipoTraduzido}`;
    
    if (arquivo) {
      mensagemCompleta += ` no arquivo \"${arquivo}\"`;
    }
    
    if (linha !== undefined) {
      mensagemCompleta += ` na linha ${linha}`;
      if (coluna !== undefined) {
        mensagemCompleta += `, coluna ${coluna}`;
      }
    }
    
    mensagemCompleta += `: ${mensagem}`;
    
    super(mensagemCompleta);
    
    this.name = 'ErroGoiano';
    this.tipo = tipo;
    this.dica = dica;
    this.linha = linha;
    this.coluna = coluna;
    this.arquivo = arquivo;
  }
  
  /**
   * Método para mostrar o erro com estilo goiano
   */
  mostrarErro() {
    console.error(`\n🤠 ${this.name}: ${this.message}`);
    
    if (this.dica) {
      console.error(`\n💡 Dica goiana: ${this.dica}`);
    }
    
    console.error(); // Linha em branco para melhor legibilidade
  }

  /**
   * Retorna informações estruturadas do erro
   * @returns {Object} Objeto com detalhes do erro
   */
  getDetalhes() {
    return {
      tipo: this.tipo,
      mensagem: this.message,
      dica: this.dica,
      localizacao: {
        arquivo: this.arquivo,
        linha: this.linha,
        coluna: this.coluna,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = ErroGoiano;