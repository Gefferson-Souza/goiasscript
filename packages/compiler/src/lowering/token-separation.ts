const SYMBOL_PAIRS: ReadonlySet<string> = new Set(['++', '--', '//', '/*', '**', '+=', '-=', '*=', '/=', '%=', '<=', '>=', '==', '!=', '=>']);

// Trocar palavra por símbolo pode colar dois símbolos num token novo (`x --1`, `/ *`).
export function needsSpace(before: string, replacement: string, after: string): boolean {
  const left = before.slice(-1) + replacement.slice(0, 1);
  const right = replacement.slice(-1) + after.slice(0, 1);
  return SYMBOL_PAIRS.has(left) || SYMBOL_PAIRS.has(right);
}
