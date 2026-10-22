import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';
import { translateRuntimeError } from '../../../src/runtime-errors/translate.ts';

function contextOf(text: string) {
  const result = compile(text);
  if (!result.ok) throw new Error('esperava ok');
  return { result, context: { map: result.map, helperRange: result.helperRange, fileName: 'programa.gs', source: text } };
}
const EMITTED_FILE = 'file:///t/a.mjs';
function fail(code: string): unknown {
  try {
    new Script(code, { filename: EMITTED_FILE }).runInNewContext({ console });
  } catch (error: unknown) {
    return error;
  }
  return undefined;
}

describe('translateRuntimeError', () => {
  it('TypeError vira GS0710 na linha do .gs, sem texto do motor', () => {
    const { result, context } = contextOf('uai o é { x: 1 }\nuai a é nada\nprosa(a.x)');
    const error = fail(result.code.replace('console.log', 'void '));
    const diagnostic = translateRuntimeError(error, context);
    expect(diagnostic.code).toBe('GS0710');
    expect(diagnostic.range.start.line).toBe(3);
    expect(diagnostic.message).not.toMatch(/Cannot read|undefined|null/);
  });
  it('cada classe do motor tem o seu código, por name e não por mensagem', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(new TypeError('x'), base).code).toBe('GS0710');
    expect(translateRuntimeError(new ReferenceError('x'), base).code).toBe('GS0711');
    expect(translateRuntimeError(new RangeError('x'), base).code).toBe('GS0712');
    expect(translateRuntimeError(new SyntaxError('x'), base).code).toBe('GS0713');
    expect(translateRuntimeError(new Error('Cannot read properties of undefined'), base).code).toBe('GS0714');
    expect(translateRuntimeError(new URIError('x'), base).code).toBe('GS0714');
    expect(translateRuntimeError('texto solto', base).code).toBe('GS0714');
  });
  it('erro de outro realm é classificado pelo name', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(fail('null.x'), base).code).toBe('GS0710');
  });
  it('erro em ajudante aponta a linha do .gs que chamou', () => {
    const text = 'uai l é 5\nprosa(l.arruma())';
    const result = compile(text);
    if (!result.ok || !result.helperRange) throw new Error('esperava ajudante');
    const helperLine = String(result.helperRange.startLine + 1);
    const error = new TypeError('x');
    error.stack = `TypeError: x\n    at $gs_ordem (file:///t/a.mjs:${helperLine}:5)\n    at file:///t/a.mjs:2:20`;
    const diagnostic = translateRuntimeError(error, { map: result.map, helperRange: result.helperRange, fileName: 'programa.gs', source: text });
    expect(diagnostic.range.start.line).toBe(2);
  });
  it('todos os frames em ajudante: largura zero em 1:1', () => {
    const range = { startLine: 1, endLine: 9 };
    const error = new TypeError('x');
    error.stack = 'TypeError: x\n    at h (file:///t/a.mjs:2:1)';
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: range, fileName: 'programa.gs', source: 'a' });
    expect(diagnostic.range.start).toMatchObject({ line: 1, column: 1, offset: 0 });
    expect(diagnostic.range.end.offset).toBe(0);
  });
  it('sem mapa, o range cobre a linha inteira do frame', () => {
    const error = new TypeError('x');
    error.stack = 'TypeError: x\n    at file:///t/a.mjs:2:3';
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: null, fileName: 'programa.gs', source: 'abc\ndefg\nh' });
    expect(diagnostic.range.start.line).toBe(2);
    expect(diagnostic.range.end.offset - diagnostic.range.start.offset).toBe(4);
  });
  it('GS0701 usa o gsLine do erro, sem depender da pilha', () => {
    const error = Object.assign(new Error('GS0701'), { gsCode: 'GS0701', gsLine: 4 });
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: null, fileName: 'programa.gs', source: 'a\nb\nc\nd' });
    expect(diagnostic).toMatchObject({ code: 'GS0701' });
    expect(diagnostic.range.start.line).toBe(4);
    expect(diagnostic.message).toContain('linha 4');
  });
  it('erro marcado com gsCode GS0702 do ajudante vira GS0702; sem a marca, é genérico', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }), base).code).toBe('GS0702');
    expect(translateRuntimeError(new Error('GS0702'), base).code).toBe('GS0714');
  });
});
