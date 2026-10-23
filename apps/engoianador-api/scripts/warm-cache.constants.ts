export const ENGOIANA_PATH = '/engoiana';
export const WARM_TIMEOUT_MS = 20_000;
export const HTTPS_PROTOCOL = 'https:';
export const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1']);

export const WARM_MESSAGES = {
  usage: 'Passa o endereço da API, sô. Exemplo: node scripts/warm-cache.ts https://engoianador.exemplo',
  invalidUrl: 'O endereço da API tem que ser https (ou localhost), ô rapaz.',
  done: (warmed: number, total: number) => `Cache aquecido: ${String(warmed)} de ${String(total)} frases, sô.`,
  failure: (label: string, reason: string) => `Deu ruim em "${label}": ${reason}`,
  networkDown: 'a rede caiu',
  status: (code: number) => `a API respondeu ${String(code)}`,
} as const;
