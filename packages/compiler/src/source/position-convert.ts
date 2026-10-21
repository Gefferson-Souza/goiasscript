import type { SourcePosition } from '../api.types.ts';

export function toLspPosition(position: SourcePosition): { readonly line: number; readonly character: number } {
  return { line: position.line - 1, character: position.column - 1 };
}

export function toMappingPosition(position: SourcePosition): { readonly line: number; readonly column: number } {
  return { line: position.line - 1, column: position.column - 1 };
}
