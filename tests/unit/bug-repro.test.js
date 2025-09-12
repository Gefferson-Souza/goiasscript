const SimpleGoiasScriptTranspiler = require('../../src/compiler/simpleTranspiler');
const TypeAnalyzer = require('../../src/types/TypeAnalyzer');

// Helper function to normalize whitespace for consistent comparisons
const normalize = (code) => code.replace(/\s+/g, ' ').trim();

describe('Bug Reproduction Tests', () => {

  test('[BUG] simpleTranspiler should handle keywords followed by semicolons', () => {
    const transpiler = new SimpleGoiasScriptTranspiler();
    const goiasCode = `
        enquanto_tiver (a < 5) {
            continua_aí;
            para_com_isso;
        }
        uai c é de_jeito_nenhum;
    `;
    const { code } = transpiler.transpile(goiasCode);
    const expectedJs = `
        while (a < 5) {
            continue;
            break;
        }
        const c = false;
    `;
    expect(normalize(code)).toBe(normalize(expectedJs));
  });

  test('[BUG] TypeAnalyzer should infer type for mixed-mode string concatenation', () => {
    const analyzer = new TypeAnalyzer();
    const codigo = 'uai resultado é "Idade: " mais 25';
    const result = analyzer.analyze(codigo);
    expect(result.symbolTable.resultado.type).toBe('STRING');
  });

});
