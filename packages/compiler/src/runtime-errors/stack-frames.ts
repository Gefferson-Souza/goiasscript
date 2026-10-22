import type { StackFrame } from './stack-frames.types.ts';

const FRAME_PREFIX = /^\s*at /u;
const POSITION_SUFFIX = /:(\d+):(\d+)$/u;
const STACK_LINE_BREAK = /\r\n|\n|\r/u;
const CALL_SITE_OPEN = ' (';
const CALL_SITE_CLOSE = ')';

// Leitura por fatias, sem regex com quantificadores vizinhos: a pilha traz texto do aluno e não pode travar a tradução.
function parseFrame(row: string): StackFrame | null {
  const prefix = FRAME_PREFIX.exec(row);
  if (prefix === null) return null;
  const body = row.slice(prefix[0].length);
  const openAt = body.endsWith(CALL_SITE_CLOSE) ? body.indexOf(CALL_SITE_OPEN) : -1;
  const location = openAt === -1 ? body : body.slice(openAt + CALL_SITE_OPEN.length, -CALL_SITE_CLOSE.length);
  const position = POSITION_SUFFIX.exec(location);
  if (position === null) return null;
  return { functionName: openAt === -1 ? null : body.slice(0, openAt), line: Number(position[1]), column: Number(position[2]) };
}

export function parseStackFrames(stack: unknown): readonly StackFrame[] {
  if (typeof stack !== 'string') return [];
  return stack.split(STACK_LINE_BREAK).flatMap((row): readonly StackFrame[] => {
    const frame = parseFrame(row);
    return frame === null ? [] : [frame];
  });
}
