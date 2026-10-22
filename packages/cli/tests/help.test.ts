import { describe, expect, it } from 'vitest';
import { renderHelp } from '../src/help/help.ts';

const ENGLISH_WORDS = /\b(usage|options?|commands?|file|version|help|error|run|check|translate)\b/iu;

describe('renderHelp', () => {
  it.each(['raiz', 'neutro'] as const)('lista os seis comandos e as opções (%s)', (tone) => {
    const help = renderHelp(tone);
    for (const name of ['traduz', 'bota_pra_moer', 'vê_se_tá_certo', 'arma_o_barraco', 'explica', 'dedo_de_prosa']) {
      expect(help).toContain(name);
    }
    for (const option of ['-s', '--otimiza', '--minifica', '--sobrescreve', '--json', '--tom']) {
      expect(help).toContain(option);
    }
    expect(help).toContain('ve_se_ta_certo');
  });
  it.each(['raiz', 'neutro'] as const)('não tem palavra em inglês (%s)', (tone) => {
    expect(ENGLISH_WORDS.test(renderHelp(tone))).toBe(false);
  });
});
