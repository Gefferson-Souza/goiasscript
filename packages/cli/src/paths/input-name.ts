import type { PlatformPath } from 'node:path';
import { printableName } from './display-text.ts';
import { PATH_CODE, SOURCE_EXTENSION } from './paths.constants.ts';
import type { InputNameResult } from './paths.types.ts';
import { WINDOWS_RESERVED_NAMES } from './windows-names.constants.ts';

const DRIVE_PREFIX = /^[A-Za-z]:(?=[\\/])/u;
const WIN32_SEPARATORS = /[\\/]/u;
const POSIX_SEPARATOR = '/';

export function isReservedWindowsName(name: string): boolean {
  const beforeFirstDot = name.split('.')[0] ?? '';
  return WINDOWS_RESERVED_NAMES.has(beforeFirstDot.trimEnd().toLowerCase());
}

function lastSegment(inputPath: string, pathApi: PlatformPath, platform: NodeJS.Platform): string {
  if (platform !== 'win32' && pathApi.sep === POSIX_SEPARATOR) return inputPath.slice(inputPath.lastIndexOf(POSIX_SEPARATOR) + 1);
  const withoutDrive = inputPath.replace(DRIVE_PREFIX, '');
  return withoutDrive.split(WIN32_SEPARATORS).at(-1) ?? '';
}

function refuse(code: (typeof PATH_CODE)[keyof typeof PATH_CODE], detail: string): InputNameResult {
  return { ok: false, code, detail };
}

export function validateInputName(inputPath: string, pathApi: PlatformPath, platform: NodeJS.Platform): InputNameResult {
  const name = lastSegment(inputPath, pathApi, platform);
  const shown = printableName(name);
  if (!name.toLowerCase().endsWith(SOURCE_EXTENSION)) return refuse(PATH_CODE.notGs, `o arquivo "${shown}" não termina em ${SOURCE_EXTENSION}`);
  const stem = name.slice(0, name.length - SOURCE_EXTENSION.length);
  if (stem === '') return refuse(PATH_CODE.notGs, `o arquivo "${shown}" não tem nome antes de ${SOURCE_EXTENSION}`);
  if (platform !== 'win32') return { ok: true, outputStem: stem };
  if (name.includes(':')) return refuse(PATH_CODE.usage, `o nome "${shown}" tem ":", que o Windows usa pra fluxo alternativo`);
  if (isReservedWindowsName(stem)) return refuse(PATH_CODE.usage, `"${printableName(stem)}" é nome reservado do Windows`);
  return { ok: true, outputStem: stem };
}
