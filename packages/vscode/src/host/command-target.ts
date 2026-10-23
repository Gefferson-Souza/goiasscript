interface UriLike {
  readonly scheme: string;
  readonly fsPath: string;
  toString(): string;
}

function isUriLike(value: unknown): value is UriLike {
  return typeof value === 'object' && value !== null && 'scheme' in value && typeof value.scheme === 'string' && 'fsPath' in value && typeof value.fsPath === 'string';
}

// Menus do explorador e do título do editor passam o arquivo clicado; comando da paleta não passa nada.
export function resourceUriOf(target: unknown): string | undefined {
  return isUriLike(target) ? target.toString() : undefined;
}
