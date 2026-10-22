import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isReservedWindowsName, validateInputName } from '../src/paths/input-name.ts';

const ok = (output: string) => ({ ok: true, outputStem: output });

describe('validateInputName (posix)', () => {
  it.each([
    ['x.gs', ok('x')],
    ['X.GS', ok('X')],
    ['a.b.gs', ok('a.b')],
    ['e.gs/f/programa.gs', ok('programa')],
    ['nome com espaço.gs', ok('nome com espaço')],
    ['-x.gs', ok('-x')],
    ['a$(touch PWNED).gs', ok('a$(touch PWNED)')],
    ['`touch PWNED`.gs', ok('`touch PWNED`')],
    ['a";touch PWNED;".gs', ok('a";touch PWNED;"')],
    ['cafe\u0301.gs', ok('cafe\u0301')],
  ])('aceita %s', (input, expected) => {
    expect(validateInputName(input, path.posix, 'linux')).toEqual(expected);
  });

  it.each(['x.txt', 'x', 'x.gs.txt', '.gs', 'x.gs ', 'x.gs.', 'x.gs/'])('recusa %s com GS0902', (input) => {
    expect(validateInputName(input, path.posix, 'linux')).toMatchObject({ ok: false, code: 'GS0902' });
  });

  it('não trata nome reservado do Windows como reservado fora do Windows', () => {
    expect(validateInputName('CON.gs', path.posix, 'linux')).toEqual(ok('CON'));
  });
});

describe('validateInputName (win32)', () => {
  it.each([
    ['C:\\Users\\Aluno\\Meu Programa.GS', 'Meu Programa'],
    ['..\\x.gs', 'x'],
    ['\\\\srv\\pasta\\x.gs', 'x'],
  ])('aceita %s', (input, stem) => {
    expect(validateInputName(input, path.win32, 'win32')).toEqual(ok(stem));
  });

  it.each(['CON.gs', 'nul.GS', 'Aux.gs', 'COM1.gs', 'lpt9.gs', 'con.txt.gs', 'C:\\x\\PRN.gs'])('recusa nome reservado %s com GS0905', (input) => {
    expect(validateInputName(input, path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0905' });
  });

  it('recusa fluxo alternativo e aceita console.gs', () => {
    expect(validateInputName('a:b.gs', path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0905' });
    expect(validateInputName('C:x.gs', path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0905' });
    expect(validateInputName('x.gs:evil', path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0902' });
    expect(validateInputName('console.gs', path.win32, 'win32')).toEqual(ok('console'));
  });
});

describe('isReservedWindowsName', () => {
  it.each(['CON', 'con', 'Nul', 'COM9', 'LPT1', 'con.txt', 'CON .txt', 'CONIN$', 'COM\u00B9'])('reconhece %s', (name) => {
    expect(isReservedWindowsName(name)).toBe(true);
  });

  it.each(['console', 'COM0', 'COM10', 'meu-projeto', 'conta', ''])('não confunde %s', (name) => {
    expect(isReservedWindowsName(name)).toBe(false);
  });
});

describe('nomes hostis nas mensagens', () => {
  it('escapa ESC e quebra de linha sem alterar o stem', () => {
    const refused = validateInputName('a\u001b]0;x\nb.txt', path.posix, 'linux');
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.detail).not.toMatch(/\p{Cc}/u);
    expect(validateInputName('a\u001bb.gs', path.posix, 'linux')).toEqual({ ok: true, outputStem: 'a\u001bb' });
  });
});
