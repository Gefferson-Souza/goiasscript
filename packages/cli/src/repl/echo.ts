import { format } from 'node:util';

export function formatEcho(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : format(value);
}
