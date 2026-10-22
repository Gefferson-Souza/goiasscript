import { isReservedWindowsName } from '../paths/input-name.ts';
import { printableName } from '../paths/display-text.ts';
import type { NameCheck } from './scaffold.types.ts';

const VALID_NAME = /^[\p{L}\p{N}][\p{L}\p{N}_.-]*$/u;
const MAX_NAME_LENGTH = 64;

const refuse = (name: string, why: string): NameCheck => ({ ok: false, detail: `o nome "${printableName(name)}" ${why}` });

export function validateProjectName(name: string, platform: NodeJS.Platform): NameCheck {
  if (Array.from(name).length > MAX_NAME_LENGTH) return refuse(name, `passa de ${String(MAX_NAME_LENGTH)} caracteres`);
  if (!VALID_NAME.test(name)) return refuse(name, 'não serve: usa um nome só, começando por letra ou número, com letras, números, "_", "." ou "-"');
  if (isReservedWindowsName(name)) return refuse(name, 'é nome reservado do Windows');
  // O Windows descarta o ponto final ao criar a pasta, o que muda o nome do projeto.
  if (platform === 'win32' && name.endsWith('.')) return refuse(name, 'termina em ponto, que o Windows descarta');
  return { ok: true };
}
