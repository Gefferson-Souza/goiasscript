const SimpleGoiasScriptTranspiler = require('../../src/compiler/simpleTranspiler');
const TypeAnalyzer = require('../../src/types/TypeAnalyzer');

describe('Pure Coverage Tests', () => {

  describe('simpleTranspiler.js', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new SimpleGoiasScriptTranspiler();
    });

    test('should cover the internal catch block on transpilation error', () => {
      // This test is designed to increase coverage of the catch block in simpleTranspiler.
      const originalRegex = transpiler._escapeRegex;
      transpiler._escapeRegex = () => { throw new Error("Forced Regex Fail"); };

      const result = transpiler.transpile('uai x é 1');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original function
      transpiler._escapeRegex = originalRegex;
    });
  });

  describe('TypeAnalyzer.js', () => {
    let analyzer;

    beforeEach(() => {
        analyzer = new TypeAnalyzer();
    });

    test('should infer type of a function expression', () => {
        // This test covers line 199 in TypeAnalyzer.js
        const codigo = 'uai minhaFunc é presta_serviço() {}';
        const result = analyzer.analyze(codigo);
        expect(result.symbolTable.minhaFunc.type).toBe('FUNCTION');
    });

    test('should return "trem estranho" for unknown type name', () => {
        // This test covers the default case on line 311 in TypeAnalyzer.js
        const goiasTypeName = analyzer._getGoiasTypeName('SOME_INVALID_TYPE_NAME');
        expect(goiasTypeName).toBe('trem estranho');
    });

    test('should correctly handle isTypeCompatible for numeric string', () => {
        // This test covers the logic on line 343 in TypeAnalyzer.js
        // The current logic correctly returns false, this test validates that behavior.
        expect(analyzer.isTypeCompatible('NUMBER', 'STRING')).toBe(false);
    });
  });
});
