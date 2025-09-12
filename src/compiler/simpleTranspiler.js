const ErrorTranslator = require('../errors/errorTranslator');

/**
 * Transpiler simplificado do GoiásScript
 * Implementa substituições diretas para funcionar imediatamente
 */
class SimpleGoiasScriptTranspiler {
  constructor(options = {}) {
    this.errorTranslator = new ErrorTranslator();
    this.options = options;
  }

  /**
   * Transpila código GoiásScript para JavaScript
   * @param {string} codigo - Código fonte GoiásScript
   * @param {string} nomeArquivo - Nome do arquivo fonte
   * @returns {Object} Resultado da transpilação
   */
  transpile(codigo, nomeArquivo = 'script.gs') {
    try {
      let codigoJS = codigo;

      // Aplicar todas as substituições
      codigoJS = this._aplicarSubstituicoes(codigoJS);
      
      return {
        success: true,
        code: codigoJS,
        warnings: [],
      };
      
    } catch (error) {
      const erroGoiano = this.errorTranslator.traduzir(error, nomeArquivo);
      return {
        success: false,
        error: erroGoiano,
        code: null,
      };
    }
  }

  /**
   * Aplica todas as substituições necessárias
   * @private
   */
  _aplicarSubstituicoes(codigo) {
    let resultado = codigo;

    // Mapeamentos diretos ordenados por tamanho (maior primeiro)
    const mapeamentos = [
      // Funções assíncronas primeiro
      ['vai_na_frente_presta_serviço', 'async function'],
      
      // Operadores compostos com 'é' primeiro
      ['é_tipo_de', 'instanceof'],
      ['é_igualim', '==='],
      
      // Classes e herança
      ['arruma_trem', 'class'],
      ['inherda_de', 'extends'],
      ['aprepara_trem', 'constructor'],
      ['num_muda', 'static'],
      
      // Estruturas de controle
      ['se_ocê_quiser', 'if'],
      ['se_num_for', 'else if'],
      ['se_não', 'else'],
      ['vai_indo', 'for'],
      ['enquanto_tiver', 'while'],
      ['para_com_isso', 'break'],
      ['continua_aí', 'continue'],
      
      // Funções
      ['presta_serviço', 'function'],
      ['faz_favor', 'return'],
      ['vai_na_frente', 'async'],
      ['espera_um_cadim', 'await'],
      
      // Operadores lógicos (removido é_igualim que já está acima)
      ['diferente', '!=='],
      ['maior_que', '>'],
      ['menor_que', '<'],
      ['pelo_menos', '>='],
      ['no_máximo', '<='],
      ['e_mais', '&&'],
      ['ou_então', '||'],
      ['num_é', '!'],
      
      // Operadores aritméticos
      ['mais', '+'],
      ['menos', '-'],
      ['vezes', '*'],
      ['dividido', '/'],
      ['sobrou', '%'],
      
      // Console
      ['prosa', 'console.log'],
      ['reclama', 'console.error'],
      
      // Promises
      ['promessa', 'Promise'],
      ['quando_resolver', 'then'],
      ['se_der_pobrema', 'catch'],
      ['resolve_aí', 'resolve'],
      ['rejeita_isso', 'reject'],
      
      // Try/catch
      ['tenta_aí', 'try'],
      ['se_der_ruim', 'catch'],
      ['por_fim', 'finally'],
      
      // Tipos
      ['certeza', 'true'],
      ['de_jeito_nenhum', 'false'],
      ['vazio', 'null'],
      ['sei_lá', 'undefined'],
      
      // Outros
      ['faz_um', 'new'],
      ['vixe', 'throw new Error'],
      ['ocê', 'this'],
      
      // Loops
      ['em', 'in'],
      ['de', 'of'],
      
      // Declarações - é precisa vir antes dos operadores compostos
      ['trem', 'var'],
      ['uai', 'const'],
      ['é', '='],
    ];

    // Aplicar cada mapeamento
    mapeamentos.forEach(([goiasWord, jsWord]) => {
      // Para palavras com acentos, usar uma abordagem mais específica
      if (goiasWord === 'é') {
        // Tratar 'é' especialmente - deve estar entre espaços
        resultado = resultado.replace(/\s+é\s+/g, ' = ');
      } else {
        // Usar word boundary para evitar substituições parciais
        const regex = new RegExp(`\\b${this._escapeRegex(goiasWord)}\\b`, 'g');
        resultado = resultado.replace(regex, jsWord);
      }
    });

    return resultado;
  }

  /**
   * Escapa caracteres especiais para regex
   * @private
   */
  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = SimpleGoiasScriptTranspiler;