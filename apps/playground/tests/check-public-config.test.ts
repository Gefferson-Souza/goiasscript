import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_ENV_PLACEHOLDERS } from '../config/site-config.constants.ts';
import { ConfigError } from '../config/site-config.ts';
import { currentSiteConfig } from '../config/current-site-config.ts';
import { loadEnvFiles, runPublicConfigCheck } from '../config/public-config-cli.ts';
import { assertPublicConfig, checkDonationLinksOnline } from '../config/public-config.ts';

const run = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('../scripts/check-public-config.ts', import.meta.url));
const PIX = 'NEXT_PUBLIC_DONATION_PIX_KEY';
const SPONSORS = 'NEXT_PUBLIC_DONATION_SPONSORS_URL';
const KOFI = 'NEXT_PUBLIC_DONATION_KOFI_URL';
const VALID_ENV = {
  NEXT_PUBLIC_SITE_URL: 'https://playground.exemplo.dev',
  [PIX]: 'minha-chave-real',
  [SPONSORS]: 'https://github.com/sponsors/alguem',
  [KOFI]: 'https://ko-fi.com/alguem',
} as const;

async function runScript(env: Readonly<Record<string, string>>, args: readonly string[] = []) {
  try {
    const { stdout, stderr } = await run(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', SCRIPT, ...args], { env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', ...env } });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code: number; stdout: string; stderr: string };
    return { code: failure.code, stdout: failure.stdout, stderr: failure.stderr };
  }
}

describe('assertPublicConfig', () => {
  it('em produção, o valor do .env.example derruba', () => {
    const env = { [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] };
    expect(() => {
      assertPublicConfig(env, 'production');
    }).toThrow(ConfigError);
  });

  it('em desenvolvimento, o valor do .env.example passa', () => {
    expect(() => {
      assertPublicConfig({ [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] }, 'development');
    }).not.toThrow();
  });

  it('com todas as variáveis válidas e diferentes do exemplo, passa', () => {
    expect(() => {
      assertPublicConfig(VALID_ENV, 'production');
    }).not.toThrow();
  });

  it('o .env.example do repositório e a tabela de placeholders andam juntos', () => {
    const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
    for (const [name, value] of Object.entries(PUBLIC_ENV_PLACEHOLDERS)) {
      expect(example).toContain(`${name}=${value}`);
    }
  });
});

describe('scripts/check-public-config.ts', () => {
  it('sai com 1, nomeia a variável em goianês e não imprime o valor', async () => {
    const result = await runScript({ [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] ?? '' });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(PIX);
    expect(result.stderr).toContain('sô');
    expect(result.stderr).not.toContain(PUBLIC_ENV_PLACEHOLDERS[PIX]);
  });

  it('sai com 0 quando a configuração está boa', async () => {
    expect((await runScript(VALID_ENV)).code).toBe(0);
  });

  it('em --online sem nenhum link, passa e avisa que não há o que conferir', async () => {
    const result = await runScript({}, ['--online']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Não tem link de doação');
  });
});

describe('checkDonationLinksOnline', () => {
  const links = [
    { kind: 'sponsors', label: 'Sponsors', href: VALID_ENV[SPONSORS] },
    { kind: 'kofi', label: 'Ko-fi', href: VALID_ENV[KOFI] },
  ] as const;
  const respond = (status: number) => (): Promise<Response> => Promise.resolve(new Response(null, { status }));

  it('2xx e 3xx passam; usa HEAD sem seguir redirecionamento', async () => {
    const calls: { init: RequestInit | undefined }[] = [];
    const fetchFn = (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push({ init });
      return Promise.resolve(new Response(null, { status: calls.length === 1 ? 200 : 302 }));
    };
    expect(await checkDonationLinksOnline(links, fetchFn)).toEqual([]);
    expect(calls.map((call) => call.init?.method)).toEqual(['HEAD', 'HEAD']);
    expect(calls[0]?.init?.redirect).toBe('manual');
    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([403, 405])('HEAD com %i é repetido como GET de 1 byte e passa se o GET der 2xx', async (headStatus) => {
    const calls: { init: RequestInit | undefined }[] = [];
    const fetchFn = (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push({ init });
      return Promise.resolve(new Response(null, { status: init?.method === 'HEAD' ? headStatus : 206 }));
    };
    expect(await checkDonationLinksOnline(links, fetchFn)).toEqual([]);
    const retry = calls.find((call) => call.init?.method === 'GET');
    expect(new Headers(retry?.init?.headers).get('range')).toBe('bytes=0-0');
    expect(retry?.init?.redirect).toBe('manual');
    expect(retry?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('manda User-Agent identificável em HEAD e GET', async () => {
    const agents: (string | null)[] = [];
    const fetchFn = (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      agents.push(new Headers(init?.headers).get('user-agent'));
      return Promise.resolve(new Response(null, { status: init?.method === 'HEAD' ? 405 : 200 }));
    };
    await checkDonationLinksOnline(links.slice(0, 1), fetchFn);
    expect(agents).toHaveLength(2);
    expect(agents.every((agent) => agent?.startsWith('goiasscript-link-check'))).toBe(true);
  });

  it('403 no HEAD e 403 no GET continua sendo falha', async () => {
    expect(await checkDonationLinksOnline(links, respond(403))).toHaveLength(2);
  });

  it('GET que cai na rede depois do HEAD 405 vira falha', async () => {
    const fetchFn = (_url: string | URL | Request, init?: RequestInit): Promise<Response> =>
      init?.method === 'HEAD' ? Promise.resolve(new Response(null, { status: 405 })) : Promise.reject(new Error('rede'));
    expect(await checkDonationLinksOnline(links, fetchFn)).toHaveLength(2);
  });

  it('404 e 500 viram falha com o nome do link, sem a URL', async () => {
    const failures = await checkDonationLinksOnline(links, respond(404));
    expect(failures).toHaveLength(2);
    expect(JSON.stringify(failures)).not.toContain('https://');
  });

  it('erro de rede também vira falha', async () => {
    const failures = await checkDonationLinksOnline(links, () => Promise.reject(new Error('rede caiu')));
    expect(failures).toHaveLength(2);
  });
});

describe('runPublicConfigCheck', () => {
  const collect = () => {
    const out: string[] = [];
    const err: string[] = [];
    return { out, err, io: { out: (text: string) => out.push(text), err: (text: string) => err.push(text) } };
  };
  const status = (code: number) => (): Promise<Response> => Promise.resolve(new Response(null, { status: code }));

  it('em --online, link fora do ar sai com 1 e não imprime a URL', async () => {
    const { err, io } = collect();
    const code = await runPublicConfigCheck(['--online'], VALID_ENV, io, status(503));
    expect(code).toBe(1);
    expect(err.join('')).toContain('Sponsors');
    expect(err.join('')).not.toContain('https://');
  });

  it('em --online, links saudáveis saem com 0', async () => {
    const { out, io } = collect();
    expect(await runPublicConfigCheck(['--online'], VALID_ENV, io, status(200))).toBe(0);
    expect(out.join('')).toContain('responderam direitinho');
  });

  it('erro que não é Error cai na mensagem genérica em goianês', async () => {
    const { err, io } = collect();
    const throwing = (): Promise<Response> => Promise.reject(new Error('x'));
    expect(await runPublicConfigCheck(['--online'], { ...VALID_ENV, [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] }, io, throwing)).toBe(1);
    expect(err.join('')).toContain(PIX);
  });
});

describe('loadEnvFiles', () => {
  it('carrega só os arquivos que existem, do mais específico ao mais geral', () => {
    const directory = mkdtempSync(join(tmpdir(), 'public-config-'));
    writeFileSync(join(directory, '.env.local'), 'A=1\n');
    writeFileSync(join(directory, '.env'), 'B=2\n');
    const loaded: string[] = [];
    loadEnvFiles(directory, (path) => loaded.push(basename(path)));
    expect(loaded).toEqual(['.env.local', '.env']);
    rmSync(directory, { recursive: true });
  });
});

describe('currentSiteConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('lê process.env no modo de produção e barra o valor de exemplo', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(PIX, PUBLIC_ENV_PLACEHOLDERS[PIX] ?? '');
    expect(() => currentSiteConfig()).toThrow(ConfigError);
  });

  it('em desenvolvimento aceita configuração vazia', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv(PIX, '');
    expect(currentSiteConfig().donation.pixKey).toBeNull();
  });
});
