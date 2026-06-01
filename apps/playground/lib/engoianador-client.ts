// URL da API do Engoianador. Em produção, NEXT_PUBLIC_ENGOIANADOR_URL é
// obrigatória — sem ela, falha explícito em vez de cair em localhost silencioso.
const DEV_URL = 'http://127.0.0.1:8787';

export function getEngoianadorUrl(): string {
  const env =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENGOIANADOR_URL : undefined;
  if (env) return env;

  const isProd =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error(
      'NEXT_PUBLIC_ENGOIANADOR_URL não configurada. Defina a URL da API do Engoianador no ambiente de produção.'
    );
  }
  return DEV_URL;
}

export async function engoianar(texto: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${getEngoianadorUrl()}/engoiana`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.message.includes('NEXT_PUBLIC')
        ? err.message
        : 'Não deu pra falar com o engoianador. Vê sua conexão, sô.'
    );
  }

  let data: { erro?: string; engoianado?: unknown } = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Resposta inválida da API (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.erro || `HTTP ${res.status}`);
  }
  if (typeof data.engoianado !== 'string') {
    throw new Error('Resposta inesperada da API');
  }
  return data.engoianado;
}
