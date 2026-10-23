export const ORIGIN_SEPARATOR = ',';
export const FLAG_ON = 'true';
export const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
export const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1']);
export const HTTPS_PROTOCOL = 'https:';
export const HTTP_PROTOCOL = 'http:';
export const REQUIRED_BINDINGS = ['QUOTA_LEDGER', 'ENGOIANADOR_CACHE'] as const;
