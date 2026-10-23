import { INTERNAL_PATH_PATTERN, SAFE_EXTERNAL_PROTOCOL } from './markdown-urls.constants.ts';

function isSafeExternal(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === SAFE_EXTERNAL_PROTOCOL && url.hostname !== '';
  } catch {
    return false;
  }
}

// Só https e caminho interno passam; qualquer outro esquema (javascript:, data:, http:) vira texto.
export function isSafeLessonHref(href: string): boolean {
  return INTERNAL_PATH_PATTERN.test(href) || (href === href.trim() && isSafeExternal(href));
}
