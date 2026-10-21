import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectJsMemberNames, JS_MEMBERS_PATH, renderJsMembers } from '../generators/js-members.ts';
import { JS_MEMBER_NAMES } from '../src/js/js-members.generated.ts';
import { STDLIB } from '../src/stdlib/index.ts';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../..');
const RFC_PATH = resolve(REPOSITORY_ROOT, 'docs/rfc/0001-vocabulario-e-biblioteca.md');
// Number.isNaN é o JavaScript de é_número na RFC, mas a entrada guarda o nome do ajudante.
const NAMES_BEHIND_HELPERS = ['isNaN'];
const OUTSIDE_ANNEX_C = ['add', 'size', 'exec', 'bind', 'call', 'apply', 'test', 'flags', 'sticky', 'lastIndex', 'description', 'global', 'get', 'set', 'has', 'clear'];

function annexCNames(): readonly string[] {
  const rfc = readFileSync(RFC_PATH, 'utf8');
  const section = rfc.slice(rfc.indexOf('### Anexo C'), rfc.indexOf('### Anexo D'));
  const rows = section.split('\n').filter((line) => /^\| [A-Za-z]/u.test(line) && !line.startsWith('| Receptor'));
  return rows.flatMap((row) => [...(row.split('|')[2] ?? '').matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? ''));
}

describe('jsMembers contra o Anexo C da RFC-0001', () => {
  const generated = new Set<string>(JS_MEMBER_NAMES);
  it('contém todos os membros listados no Anexo C', () => {
    const annex = annexCNames();
    expect(annex.length).toBeGreaterThan(150);
    expect(annex.filter((name) => !generated.has(name))).toEqual([]);
  });
  it('não traz nomes exclusivos de receptores fora do Anexo C (Map, Set, RegExp, Function)', () => {
    expect(OUTSIDE_ANNEX_C.filter((name) => generated.has(name))).toEqual([]);
  });
  it('o que sobra além do Anexo C é só nome da coluna JavaScript da biblioteca ou __proto__', () => {
    const annex = new Set(annexCNames());
    const stdlibJs = new Set(STDLIB.flatMap((entry) => entry.js.match(/[A-Za-z_]\w*/gu) ?? []));
    const extra = JS_MEMBER_NAMES.filter((name) => !annex.has(name) && name !== '__proto__' && !NAMES_BEHIND_HELPERS.includes(name) && !stdlibJs.has(name));
    expect(extra).toEqual([]);
  });
});

describe('gerador de jsMembers', () => {
  it('o arquivo versionado é idêntico ao que o gerador produz', () => {
    const versioned = readFileSync(resolve(REPOSITORY_ROOT, JS_MEMBERS_PATH), 'utf8');
    expect(renderJsMembers(collectJsMemberNames())).toBe(versioned);
  });
  it('renderiza a lista como constante tipada com um nome por linha', () => {
    const output = renderJsMembers(['a', 'b']);
    expect(output).toContain("export const JS_MEMBER_NAMES = [\n  'a',\n  'b',\n] as const;");
  });
});
