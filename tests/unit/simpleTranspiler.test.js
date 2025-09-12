const SimpleGoiasScriptTranspiler = require('../../src/compiler/simpleTranspiler');

// Helper function to normalize whitespace for consistent comparisons
const normalize = (code) => code.replace(/\s+/g, ' ').trim();

describe('SimpleGoiasScriptTranspiler', () => {
  let transpiler;

  beforeEach(() => {
    transpiler = new SimpleGoiasScriptTranspiler();
  });

  describe('Untested Keyword Transpilation', () => {
    test('should transpile `trem` to `var`', () => {
      const goiasCode = 'trem x é 10;';
      const { code } = transpiler.transpile(goiasCode);
      expect(normalize(code)).toBe('var x = 10;');
    });

    test('should transpile `enquanto_tiver` to `while`', () => {
      const goiasCode = 'enquanto_tiver (certeza) { prosa("bão"); }';
      const { code } = transpiler.transpile(goiasCode);
      expect(normalize(code)).toBe('while (true) { console.log("bão"); }');
    });

    test('should transpile `se_num_for` to `else if`', () => {
      const goiasCode = `
        se_ocê_quiser (x > 10) {
          prosa("maior");
        } se_num_for (x < 10) {
          prosa("menor");
        }
      `;
      const { code } = transpiler.transpile(goiasCode);
      expect(normalize(code)).toBe('if (x > 10) { console.log("maior"); } else if (x < 10) { console.log("menor"); }');
    });

    test('should transpile `para_com_isso` and `continua_aí`', () => {
      const goiasCode = `
        vai_indo (trem i é 0; i < 10; i = i + 1) {
          se_ocê_quiser (i === 2) { continua_aí; }
          se_ocê_quiser (i === 8) { para_com_isso; }
        }
      `;
      const { code } = transpiler.transpile(goiasCode);
      const expectedJs = `
        for (var i = 0; i < 10; i = i + 1) {
          if (i === 2) { continue; }
          if (i === 8) { break; }
        }
      `;
      expect(normalize(code)).toBe(normalize(expectedJs));
    });

    test('should transpile `vixe` to `throw new Error`', () => {
        const goiasCode = 'vixe "Deu ruim!"';
        const { code } = transpiler.transpile(goiasCode);
        expect(normalize(code)).toBe('throw new Error "Deu ruim!"');
    });

    test('should transpile `num_muda` to `static`', () => {
        const goiasCode = `
            arruma_trem Ferramenta {
                num_muda presta_serviço martelar() {
                    prosa("Martelando");
                }
            }
        `;
        const { code } = transpiler.transpile(goiasCode);
        expect(normalize(code)).toContain('class Ferramenta { static function martelar() { console.log("Martelando"); } }');
    });
  });

  describe('Operator Transpilation', () => {
    const cases = [
      ['1 é_igualim 1', '1 === 1'],
      ['1 diferente 1', '1 !== 1'],
      ['1 menor_que 1', '1 < 1'],
      ['1 pelo_menos 1', '1 >= 1'],
      ['1 no_máximo 1', '1 <= 1'],
      ['a e_mais b', 'a && b'],
      ['a ou_então b', 'a || b'],
      ['num_é a', '!a'],
      ['2 menos 1', '2 - 1'],
      ['2 vezes 2', '2 * 2'],
      ['4 dividido 2', '4 / 2'],
      ['5 sobrou 2', '5 % 2'],
    ];

    test.each(cases)('should transpile "%s"', (goias, js) => {
      // Wrap in a statement to ensure valid syntax
      const goiasCode = `uai r é ${goias};`;
      const { code } = transpiler.transpile(goiasCode);
      const expectedJs = `const r = ${js};`;
      expect(normalize(code)).toBe(normalize(expectedJs));
    });
  });

  describe('Value Transpilation', () => {
    test('should transpile boolean and nullish values', () => {
      const goiasCode = `
        uai a é certeza;
        uai b é de_jeito_nenhum;
        uai c é vazio;
        uai d é sei_lá;
      `;
      const { code } = transpiler.transpile(goiasCode);
      const expectedJs = `
        const a = true;
        const b = false;
        const c = null;
        const d = undefined;
      `;
      expect(normalize(code)).toBe(normalize(expectedJs));
    });
  });

  describe('String Protection', () => {
    test('should not transpile keywords inside strings', () => {
      const goiasCode = 'uai frase é "uai, que trem doido é esse?";';
      const { code } = transpiler.transpile(goiasCode);
      expect(normalize(code)).toBe('const frase = "uai, que trem doido é esse?";');
    });

    test('should handle single and double quotes correctly', () => {
      const goiasCode = `
        prosa('uai, se_ocê_quiser, é só chamar');
        prosa("uai, se_ocê_quiser, é só chamar");
      `;
      const { code } = transpiler.transpile(goiasCode);
      const expectedJs = `
        console.log('uai, se_ocê_quiser, é só chamar');
        console.log("uai, se_ocê_quiser, é só chamar");
      `;
      expect(normalize(code)).toBe(normalize(expectedJs));
    });
  });

  describe('Error Handling', () => {
    test('should trigger catch block on internal transpilation error', () => {
        // Temporarily break one of the regexes to force an error
        const originalRegex = transpiler._escapeRegex;
        transpiler._escapeRegex = () => { throw new Error("Regex Fail"); };

        const result = transpiler.transpile('uai x é 1');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeTruthy(); // Check that an error message exists

        // Restore original function
        transpiler._escapeRegex = originalRegex;
    });
  });
});
