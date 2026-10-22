const RUNTIME_CODE = { TypeError: 'GS0710', ReferenceError: 'GS0711', RangeError: 'GS0712', SyntaxError: 'GS0713' } as const;
export const GENERIC_RUNTIME_CODE = 'GS0714';

const CODE_BY_CLASS: ReadonlyMap<string, string> = new Map(Object.entries(RUNTIME_CODE));
const COMPILER_CODES: ReadonlySet<string> = new Set(['GS0701', 'GS0702', 'GS0703']);

// `instanceof Error` falha entre realms (vm, worker); o name atravessa.
export function isErrorLike(value: unknown): value is { readonly name: string } {
  return typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string';
}

export function classifyRuntimeError(error: unknown): string {
  if (!isErrorLike(error)) return GENERIC_RUNTIME_CODE;
  if ('gsCode' in error && typeof error.gsCode === 'string' && COMPILER_CODES.has(error.gsCode)) return error.gsCode;
  return CODE_BY_CLASS.get(error.name) ?? GENERIC_RUNTIME_CODE;
}

export function loopLineOf(error: unknown): number | undefined {
  return isErrorLike(error) && 'gsLine' in error && typeof error.gsLine === 'number' ? error.gsLine : undefined;
}
