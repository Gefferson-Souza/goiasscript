import { describe, expect, it } from 'vitest';
import { renderTextmateFiles } from '../generators/textmate.ts';

interface GrammarPattern {
  readonly name?: string;
  readonly match?: string;
  readonly begin?: string;
  readonly end?: string;
  readonly captures?: Readonly<Record<string, { readonly name: string }>>;
}

interface ScopedText {
  readonly text: string;
  readonly scope: string;
}

interface Candidate {
  readonly pattern: GrammarPattern;
  readonly found: RegExpExecArray;
}

const grammar = JSON.parse(renderTextmateFiles()[0]?.content ?? '{}') as { readonly patterns: readonly GrammarPattern[] };

function earliest(line: string, from: number): Candidate | undefined {
  let best: Candidate | undefined;
  for (const pattern of grammar.patterns) {
    const expression = new RegExp(pattern.match ?? pattern.begin ?? '', 'gu');
    expression.lastIndex = from;
    const found = expression.exec(line);
    if (found !== null && (best === undefined || found.index < best.found.index)) best = { pattern, found };
  }
  return best;
}

function captured(candidate: Candidate): readonly ScopedText[] {
  const { pattern, found } = candidate;
  if (pattern.captures === undefined) return [{ text: found[0], scope: pattern.name ?? '' }];
  return Object.entries(pattern.captures).map(([group, capture]) => ({ text: found[Number(group)] ?? '', scope: capture.name }));
}

// Imita a regra do TextMate numa linha: ganha o casamento que começa antes e, no empate, o padrão que vem primeiro.
function scopesOf(line: string): readonly ScopedText[] {
  const tokens: ScopedText[] = [];
  let position = 0;
  for (let candidate = earliest(line, position); candidate !== undefined; candidate = earliest(line, position)) {
    const { pattern, found } = candidate;
    const closing = pattern.end === undefined ? -1 : line.indexOf(pattern.end, found.index + found[0].length);
    const end = closing < 0 ? found.index + Math.max(found[0].length, 1) : closing + 1;
    tokens.push(...(pattern.end === undefined ? captured(candidate) : [{ text: line.slice(found.index, end), scope: pattern.name ?? '' }]));
    position = end;
  }
  return tokens;
}

const scopeOf = (line: string, text: string): string | undefined => scopesOf(line).find((token) => token.text === text)?.scope;

describe('realce de nomes no TextMate', () => {
  it('pinta o nome da função na declaração e mantém a palavra-chave', () => {
    const line = 'vai_na_frente faz_trem saudar(pessoa) {';
    expect(scopeOf(line, 'saudar')).toBe('entity.name.function.goiasscript');
    expect(scopeOf(line, 'faz_trem')).toBe('storage.type.function.goiasscript');
    expect(scopeOf(line, 'vai_na_frente')).toBe('storage.type.function.goiasscript');
  });

  it('pinta o nome da função na chamada, com e sem ponto', () => {
    expect(scopeOf('uai x é saudar(nome)', 'saudar')).toBe('entity.name.function.goiasscript');
    expect(scopeOf('prosa(conta.depositar (10))', 'depositar')).toBe('entity.name.function.goiasscript');
  });

  it('pinta a constante declarada com uai e deixa o trem sem cor de constante', () => {
    expect(scopeOf('uai preço é 10', 'preço')).toBe('variable.other.constant.goiasscript');
    expect(scopeOf('uai preço é 10', 'uai')).toBe('storage.type.goiasscript');
    expect(scopeOf('trem total é 0', 'total')).toBeUndefined();
  });

  it('não troca o escopo de palavra-chave, biblioteca e texto seguidos de parêntese', () => {
    expect(scopeOf('se_ocê_quiser (certeza) {', 'se_ocê_quiser')).toBe('keyword.control.goiasscript');
    expect(scopeOf('prosa("oi")', 'prosa')).toBe('support.function.goiasscript');
    expect(scopeOf('prosa(nome.gritando())', 'gritando')).toBe('support.function.member.goiasscript');
    expect(scopeOf('vixe(faz_um Erro("x"))', 'vixe')).toBe('keyword.control.trycatch.goiasscript');
    expect(scopeOf('prosa("saudar(nome)")', '"saudar(nome)"')).toBe('string.quoted.double.goiasscript');
    expect(scopeOf('uai uai é 1', 'é')).toBe('keyword.operator.assignment.goiasscript');
  });
});
