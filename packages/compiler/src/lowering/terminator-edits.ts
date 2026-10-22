import type { AstNode, Statement } from '../ast/ast.types.ts';
import type { SourceText } from '../source/source.types.ts';
import type { Edit, EditContext } from './edit.types.ts';

const SIMPLE_STATEMENTS: ReadonlySet<string> = new Set(['VariableDeclaration', 'ExpressionStatement', 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'ThrowStatement']);
const TERMINATOR = ';';

// O `end` da instrução não inclui o `;` do aluno, então ele é procurado logo depois.
function hasTerminatorAhead(source: SourceText, from: number): boolean {
  let cursor = from;
  while (source.text[cursor] === ' ' || source.text[cursor] === '\t') cursor += 1;
  return source.text[cursor] === TERMINATOR;
}

export function terminatorEdit(statement: Statement, source: SourceText, order: number): Edit | null {
  if (!SIMPLE_STATEMENTS.has(statement.type) || hasTerminatorAhead(source, statement.end)) return null;
  return { start: statement.end, end: statement.end, text: TERMINATOR, order };
}

// O `;` entra só no `body` de Program e de bloco: o cabeçalho do `vai_indo` não é elemento de `body`.
export function terminatorEdits(node: AstNode, context: EditContext): readonly Edit[] {
  if (node.type !== 'Program' && node.type !== 'BlockStatement') return [];
  return node.body.flatMap((statement) => {
    const edit = terminatorEdit(statement, context.source, context.nextOrder());
    return edit === null ? [] : [edit];
  });
}
