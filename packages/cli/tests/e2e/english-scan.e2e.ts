import { afterAll, describe, expect, it } from 'vitest';
import { findForbiddenEnglish } from './support/forbidden-english.ts';
import { cleanupWorkspaces, fixture, runInstalled } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const EXIT_OK = 0;
const SCANNED_FILES = {
  'quebrado.gs': 'uai x é\n',
  'nulo.gs': 'uai coisa é nada\nprosa(coisa.x)\n',
  'repetido.gs': 'prosa("a".repete(-1))\n',
  'recursivo.gs': 'faz_trem de_novo() { faz_favor de_novo() }\nde_novo()\n',
  'cedo.gs': 'prosa(antes)\nuai antes é 1\n',
  'nao_funcao.gs': 'uai n é 5\nn()\n',
  'nao_construtor.gs': 'uai n é 5\nfaz_um n()\n',
} as const;

const COMMANDS: readonly (readonly string[])[] = [
  ['dedo_de_prosa'],
  ['explica', 'GS0301'],
  ['vê_se_tá_certo', 'quebrado.gs'],
  ['bota_pra_moer', 'quebrado.gs'],
  ['bota_pra_moer', 'nulo.gs'],
  ['bota_pra_moer', 'repetido.gs'],
  ['bota_pra_moer', 'recursivo.gs'],
  ['bota_pra_moer', 'cedo.gs'],
  ['bota_pra_moer', 'nao_funcao.gs'],
  ['bota_pra_moer', 'nao_construtor.gs'],
];

describe('nenhuma mensagem em inglês vaza para o usuário', () => {
  it.each(COMMANDS)('%s %s', async (...args) => {
    const dir = fixture(SCANNED_FILES);
    const run = await runInstalled(args, { cwd: dir });
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });

  it('o dedo_de_prosa não muda sem querer', async () => {
    const run = await runInstalled(['dedo_de_prosa']);
    expect(run.exitCode).toBe(EXIT_OK);
    const stable = run.stdout.replace(/^Node .*$/mu, 'Node <versão>').replace(/^Sistema .*$/mu, 'Sistema <plataforma>').replace(/\d+\.\d+\.\d+(-[\w.]+)?/gu, '<versão>');
    expect(stable).toMatchSnapshot();
  });
});
