import { Parser, tokTypes } from 'acorn';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { lookupJsReserved } from '@goiasscript/language';
import { compile } from '../../src/compile.ts';

const ES2022_RESERVED = ['await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'];
const STRICT_RESERVED = ['implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield'];
const UNIVERSE = [...new Set([...Object.values(tokTypes).flatMap((type) => (type.keyword === undefined ? [] : [type.keyword])), ...ES2022_RESERVED, ...STRICT_RESERVED, 'eval', 'arguments'])];

function rejectedByEngine(word: string): boolean {
  try { Parser.parse(`const ${word} = 1`, { ecmaVersion: 2022, sourceType: 'module' }); } catch { return true; }
  try { new Script(`'use strict'; const ${word} = 1`); } catch { return true; }
  return false;
}

const BINDING_POSITIONS: ReadonlyArray<(name: string) => string> = [
  (n) => `uai ${n} é 1`,
  (n) => `faz_trem f(${n}) {}`,
  (n) => `faz_trem ${n}() {}`,
  (n) => `arruma_trem ${n} {}`,
  (n) => `uai f é ${n} => ${n}`,
  (n) => `tenta_aí { prosa(1) } se_der_ruim (${n}) {}`,
  (n) => `vai_indo (uai ${n} de [1]) {}`,
];

describe('paridade de reservadas com o acorn', () => {
  it('toda palavra que o motor rejeita como nome está em jsReserved', () => {
    const missing = UNIVERSE.filter((word) => rejectedByEngine(word) && !lookupJsReserved(word));
    expect(missing).toEqual([]);
  });
  it('toda palavra de jsReserved é rejeitada como nome nas 7 posições', () => {
    const accepted: string[] = [];
    for (const word of UNIVERSE.filter((w) => lookupJsReserved(w))) {
      for (const position of BINDING_POSITIONS) {
        const result = compile(position(word));
        if (result.ok) accepted.push(`${word}: ${position(word)}`);
      }
    }
    expect(accepted).toEqual([]);
  });
});
