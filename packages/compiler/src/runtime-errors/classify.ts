// O Firefox estoura a pilha com InternalError, onde os outros motores lançam RangeError.
const RUNTIME_CODE = { TypeError: 'GS0710', ReferenceError: 'GS0711', RangeError: 'GS0712', InternalError: 'GS0712', SyntaxError: 'GS0713' } as const;
export const GENERIC_RUNTIME_CODE = 'GS0714';
const RUNTIME_VARIANT = { stackOverflow: 'stackOverflow', invalidJson: 'invalidJson' } as const;

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

const STACK_OVERFLOW_MESSAGE = /call stack|recursion/iu;
const INVALID_JSON_MESSAGE = /JSON/u;

// O motor só distingue estouro de pilha e JSON inválido pela mensagem; o código continua vindo do name.
export function runtimeVariantOf(error: unknown): string | undefined {
  if (!isErrorLike(error)) return undefined;
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  if (error.name === 'InternalError' || (error.name === 'RangeError' && STACK_OVERFLOW_MESSAGE.test(message))) return RUNTIME_VARIANT.stackOverflow;
  return error.name === 'SyntaxError' && INVALID_JSON_MESSAGE.test(message) ? RUNTIME_VARIANT.invalidJson : undefined;
}
