import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertOutsideRepository,
  collectVideoFacts,
  parseVideoFactsArgs,
  runVideoFacts,
  serializeVideoFacts,
} from '../../../scripts/video-facts.ts';
import { countTestsFromReport } from '../../../scripts/video-facts-report.ts';
import type { CliRun, CliRunOptions, VideoFactsDeps } from '../../../scripts/video-facts.types.ts';

const ROOT = path.resolve('repo-root');
const FIXED_DATE = new Date('2026-10-23T12:00:00.000Z');
const VAR_KEYWORD_STDOUT = 'let idade = 30;\n';

const fakeRun = (args: readonly string[], options?: CliRunOptions): CliRun => {
  const command = `goiasscript ${args.join(' ')}`;
  if (args[0] === 'traduz') return { command, stdout: VAR_KEYWORD_STDOUT, stderr: '', exitCode: 0 };
  if (args[0] === 'bota_pra_moer') return { command, stdout: 'Bão, sô! Olá, mundo\n', stderr: 'aviso de teste\n', exitCode: 0 };
  return { command, stdout: `saída de ${args[0] ?? ''} em ${options?.cwd ?? '.'}\n`, stderr: '', exitCode: 0 };
};

function deps(overrides: Partial<VideoFactsDeps> = {}): VideoFactsDeps {
  return {
    readVersion: () => Promise.resolve('3.0.0'),
    countTests: () => Promise.resolve({ count: 4321, source: 'ci' }),
    runCli: (args, options) => Promise.resolve(fakeRun(args, options)),
    fetchEngoianador: null,
    now: () => FIXED_DATE,
    ...overrides,
  };
}

describe('collectVideoFacts', () => {
  it('lê a versão do package.json', async () => {
    const facts = await collectVideoFacts(deps({ readVersion: () => Promise.resolve('3.4.5') }));
    expect(facts.version).toBe('3.4.5');
    expect(facts.generatedAt).toBe(FIXED_DATE.toISOString());
  });

  it('guarda a contagem de testes com a origem', async () => {
    const facts = await collectVideoFacts(deps({ countTests: () => Promise.resolve({ count: 77, source: 'local' }) }));
    expect(facts.tests).toEqual({ count: 77, source: 'local' });
  });

  it('guarda stdout e stderr separados', async () => {
    const facts = await collectVideoFacts(deps());
    const run = facts.cli.find((entry) => entry.command.includes('bota_pra_moer'));
    expect(run?.stdout).toBe('Bão, sô! Olá, mundo\n');
    expect(run?.stderr).toBe('aviso de teste\n');
    expect(run?.exitCode).toBe(0);
  });

  it('roda os comandos do barraco armado pelo próprio CLI', async () => {
    const facts = await collectVideoFacts(deps());
    expect(facts.cli.map((entry) => entry.command)).toEqual([
      'goiasscript arma_o_barraco demo',
      'goiasscript bota_pra_moer main.gs',
      'goiasscript vê_se_tá_certo main.gs',
    ]);
  });

  it('pega o trem para let do traduz real', async () => {
    const facts = await collectVideoFacts(deps());
    expect(facts.varKeywordToLet.before).toContain('trem');
    expect(facts.varKeywordToLet.after).toBe(VAR_KEYWORD_STDOUT);
  });

  it('recusa o traduz que falha em vez de inventar a saída', async () => {
    const failing = deps({
      runCli: (args, options) => Promise.resolve(args[0] === 'traduz' ? { ...fakeRun(args, options), exitCode: 3 } : fakeRun(args, options)),
    });
    await expect(collectVideoFacts(failing)).rejects.toThrow(/traduz/u);
  });

  it('sem URL do Engoianador marca pending-owner', async () => {
    const facts = await collectVideoFacts(deps({ fetchEngoianador: null }));
    expect(facts.engoianador).toEqual({ status: 'pending-owner' });
  });

  it('com URL do Engoianador guarda pedido e resposta reais', async () => {
    const facts = await collectVideoFacts(deps({ fetchEngoianador: (text) => Promise.resolve(`goianês de: ${text}`) }));
    expect(facts.engoianador.status).toBe('ok');
    if (facts.engoianador.status === 'ok') expect(facts.engoianador.response).toBe(`goianês de: ${facts.engoianador.request}`);
  });
});

describe('countTestsFromReport', () => {
  it('conta testes do relatório JSON', () => {
    expect(countTestsFromReport(JSON.stringify({ numTotalTests: 1234, numPassedTests: 1200 }))).toBe(1234);
  });

  it('recusa relatório sem a contagem', () => {
    expect(() => countTestsFromReport('{}')).toThrow(/numTotalTests/u);
    expect(() => countTestsFromReport('não é json')).toThrow();
  });
});

describe('assertOutsideRepository', () => {
  it('recusa --out dentro do repositório', () => {
    expect(() => {
      assertOutsideRepository(path.join(ROOT, 'video-facts.json'), ROOT);
    }).toThrow(/repositório/u);
    expect(() => {
      assertOutsideRepository(path.join(ROOT, 'sub', '..', 'x.json'), ROOT);
    }).toThrow(/repositório/u);
  });

  it('aceita --out fora do repositório', () => {
    expect(() => {
      assertOutsideRepository(path.resolve('outro-lugar', 'video-facts.json'), ROOT);
    }).not.toThrow();
  });
});

describe('serializeVideoFacts', () => {
  it('o JSON não contém segredo', async () => {
    const secret = 'gsk_valor_super_secreto';
    const facts = await collectVideoFacts(deps({ fetchEngoianador: () => Promise.resolve(`eco ${secret}`) }));
    expect(() => serializeVideoFacts(facts, { GROQ_API_KEY: secret })).toThrow(/segredo/u);
    const clean = await collectVideoFacts(deps());
    expect(serializeVideoFacts(clean, { GROQ_API_KEY: secret })).not.toContain(secret);
  });
});

describe('parseVideoFactsArgs', () => {
  it('lê --out e --tests-from', () => {
    expect(parseVideoFactsArgs(['--out', '/x/f.json', '--tests-from', '/x/r.json'])).toEqual({ out: '/x/f.json', testsFrom: '/x/r.json' });
    expect(parseVideoFactsArgs(['--out', '/x/f.json'])).toEqual({ out: '/x/f.json', testsFrom: null });
  });

  it('exige --out', () => {
    expect(() => parseVideoFactsArgs([])).toThrow(/--out/u);
  });
});

describe('runVideoFacts', () => {
  const memoryIo = () => {
    const out: string[] = [];
    const err: string[] = [];
    return { out, err, io: { out: (text: string) => { out.push(text); }, err: (text: string) => { err.push(text); } } };
  };

  it('grava o JSON no caminho pedido', async () => {
    const written = new Map<string, string>();
    const { io } = memoryIo();
    const target = path.resolve('fora', 'facts.json');
    const code = await runVideoFacts({ argv: ['--out', target], root: ROOT, env: {}, deps: deps(), io, writeFile: (file, text) => { written.set(file, text); } });
    expect(code).toBe(0);
    const parsed = JSON.parse(written.get(target) ?? '{}') as { version?: string };
    expect(parsed.version).toBe('3.0.0');
  });

  it('não grava quando o --out cai dentro do repositório', async () => {
    const written = new Map<string, string>();
    const { io, err } = memoryIo();
    const code = await runVideoFacts({ argv: ['--out', path.join(ROOT, 'facts.json')], root: ROOT, env: {}, deps: deps(), io, writeFile: (file, text) => { written.set(file, text); } });
    expect(code).toBe(1);
    expect(written.size).toBe(0);
    expect(err.join('')).toContain('repositório');
  });
});
