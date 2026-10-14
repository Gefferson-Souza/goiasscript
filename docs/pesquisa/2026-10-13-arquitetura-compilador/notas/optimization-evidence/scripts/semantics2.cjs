console.log('2**31 * 2      =', 2 ** 31 * 2, '| (2**31) << 1 =', (2 ** 31) << 1, '(multiplicar por 2 não vira shift: shift converte para int32)');
console.log('5 / 2          =', 5 / 2, '| 5 >> 1 =', 5 >> 1, '(dividir por 2 não vira shift)');
console.log('0.1 + 0.2 + 0.3 =', 0.1 + 0.2 + 0.3, '| 0.1 + (0.2 + 0.3) =', 0.1 + (0.2 + 0.3), '(reassociar soma de floats muda o resultado)');
