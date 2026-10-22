import { describe, expect, it } from 'vitest';
import { parseCommandLine } from '../src/args/parse-args.ts';
import { resolveCommandName, suggestCommandName } from '../src/args/resolve-command.ts';

describe('resolveCommandName', () => {
  it.each([
    ['traduz', 'translate'], ['bota_pra_moer', 'run'], ['vê_se_tá_certo', 'check'], ['ve_se_ta_certo', 'check'],
    ['ve\u0302_se_ta\u0301_certo', 'check'], ['arma_o_barraco', 'scaffold'], ['explica', 'explain'], ['dedo_de_prosa', 'info'],
  ])('%s resolve para %s', (typed, expected) => {
    expect(resolveCommandName(typed)).toBe(expected);
  });
  it('não aceita apelidos em inglês', () => {
    for (const english of ['translate', 'run', 'check', 'compile', 'help', 'version', 'init', 'explain']) {
      expect(resolveCommandName(english)).toBeNull();
    }
  });
  it('sugere o comando mais próximo até distância 2', () => {
    expect(suggestCommandName('bota_pra_moe')).toBe('bota_pra_moer');
    expect(suggestCommandName('traduza')).toBe('traduz');
    expect(suggestCommandName('zzzzzzzz')).toBeNull();
  });
  it('sugere o nome acentuado quando o erro é na variante sem acento', () => {
    expect(suggestCommandName('ve_se_ta_certu')).toBe('vê_se_tá_certo');
  });
});

describe('parseCommandLine', () => {
  it('lê opções do traduz', () => {
    const result = parseCommandLine(['traduz', 'x.gs', '-s', 'saida.mjs', '--minifica', '--tom', 'neutro']);
    expect(result).toMatchObject({ ok: true, parsed: { command: 'translate', positionals: ['x.gs'], options: { output: 'saida.mjs', minify: true, optimize: false, tone: 'neutro' } } });
  });
  it('aceita --tom=neutro, --json e --sobrescreve', () => {
    const result = parseCommandLine(['traduz', 'x.gs', '--tom=neutro', '--json', '--sobrescreve']);
    expect(result).toMatchObject({ ok: true, parsed: { options: { tone: 'neutro', json: true, overwrite: true } } });
  });
  it('usa o tom raiz por padrão e aceita "-" no traduz', () => {
    expect(parseCommandLine(['traduz', '-'])).toMatchObject({ ok: true, parsed: { positionals: ['-'], options: { tone: 'raiz' } } });
  });
  it('aceita nome começando com hífen depois de --', () => {
    expect(parseCommandLine(['traduz', '--', '-x.gs'])).toMatchObject({ ok: true, parsed: { positionals: ['-x.gs'] } });
  });
  it('não aceita abreviação de opção', () => {
    const result = parseCommandLine(['traduz', 'x.gs', '--mini']);
    expect(result).toMatchObject({ ok: false });
  });
  it.each([
    [['traduz', 'x.gs', '--help'], '--help'], [['traduz'], 'arquivo'], [['traduz', 'a.gs', 'b.gs'], 'arquivo'],
    [['traduz', 'x.gs', '--otimiza', '--minifica'], '--otimiza'], [['traduz', 'x.gs', '--tom', 'gritado'], 'gritado'],
    [['bota_pra_moer', 'x.gs', '--json'], '--json'], [['bota_pra_moer', '-'], '-'], [['--tom', 'neutro', 'traduz', 'x.gs'], '--tom'],
    [['traduz', 'x.gs', '--tom'], '--tom'], [['traduz', 'x.gs', '--json=sim'], '--json'], [['dedo_de_prosa', 'x'], 'dedo_de_prosa'],
    [['traduz', '--help'], '--help'], [[], 'comando'],
  ])('recusa %j', (argv, mention) => {
    const result = parseCommandLine(argv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toContain(mention);
  });
});
