import { describe, expect, it } from 'vitest';
import { parseReplCommand } from '../src/repl/repl-commands.ts';

describe('parseReplCommand', () => {
  it.each([
    ['.vaza', 'exit'],
    ['.lembra_ai', 'history'],
    ['.lembra_aí', 'history'],
    ['.mostra_os_trem', 'bindings'],
    ['.zera_o_trem', 'reset'],
    ['.limpa_o_terreiro', 'clear'],
    ['.desenrola', 'help'],
    ['.vaza  ', 'exit'],
  ])('%s resolve para %s', (line, id) => {
    expect(parseReplCommand(line)).toEqual({ kind: 'command', id });
  });
  it('comando parecido vira desconhecido com sugestão', () => {
    expect(parseReplCommand('.vazaa')).toEqual({ kind: 'unknown', typed: '.vazaa', suggestion: '.vaza' });
    expect(parseReplCommand('.xyzxyzxyz')).toEqual({ kind: 'unknown', typed: '.xyzxyzxyz' });
  });
  it('número com ponto e linhas comuns não são comando', () => {
    expect(parseReplCommand('.5 mais 1')).toBeNull();
    expect(parseReplCommand('.5')).toBeNull();
    expect(parseReplCommand('1 mais 1')).toBeNull();
    expect(parseReplCommand('.')).toBeNull();
    expect(parseReplCommand('  .vaza')).toBeNull();
    expect(parseReplCommand('')).toBeNull();
  });
});
