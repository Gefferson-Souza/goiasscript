import type { MemberExpression } from '../ast/ast.types.ts';

const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';

const countOf = (text: string, char: string): number => text.split(char).length - 1;

// O receptor entre parênteses termina antes do ")": o corte pula um ")" para cada "(" aberto antes dele.
export function receiverEnd(member: MemberExpression, text: string): number {
  const opened = countOf(text.slice(member.start, member.object.start), OPEN_PAREN);
  return Array.from({ length: opened }).reduce<number>((cut) => text.indexOf(CLOSE_PAREN, cut) + 1, member.object.end);
}
