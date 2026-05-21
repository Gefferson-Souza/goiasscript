const DEFAULT_URL = 'http://127.0.0.1:8787';

export function getEngoianadorUrl(): string {
  const env =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENGOIANADOR_URL : undefined;
  return env || DEFAULT_URL;
}

export async function engoianar(texto: string): Promise<string> {
  const res = await fetch(`${getEngoianadorUrl()}/engoiana`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.erro || `HTTP ${res.status}`);
  }
  if (typeof data.engoianado !== 'string') {
    throw new Error('Resposta inesperada da API');
  }
  return data.engoianado;
}
