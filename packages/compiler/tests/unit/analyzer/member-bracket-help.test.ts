import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';

const firstOf = (text: string) => compile(text).diagnostics[0];

describe('GS0305 ensina o colchete para campo que veio de fora', () => {
  it('sem sugestão, a ajuda mostra o colchete com o nome do campo', () => {
    const diagnostic = firstOf('uai d é Coisa.vira_coisa("{}")\nprosa(d.saldo)');
    expect(diagnostic?.message).toBe('Esse trem ".saldo" não existe por aqui.');
    expect(diagnostic?.help).toBe('Se a coisa veio de fora, como um JSON, lê com colchete: ["saldo"].');
  });
  it('com sugestão de nome parecido, não fala de colchete', () => {
    const diagnostic = firstOf('uai p é { nome: 1 }\nprosa(p.nmoe)');
    expect(diagnostic?.message).toBe('Esse trem ".nmoe" não existe por aqui. Cê quis dizer ".nome"?');
    expect(diagnostic?.help ?? '').not.toContain('colchete');
  });
});
