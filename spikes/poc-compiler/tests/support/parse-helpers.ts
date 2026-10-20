import type { Expression, ParseResult, Statement } from '../../src/ast.types.ts';
import { createLineTable, positionAt } from '../../src/diagnostics.ts';
import { createLexer } from '../../src/lexer.ts';
import { parse } from '../../src/parser.ts';

export interface ParsedFile { readonly result: ParseResult; readonly found: readonly string[] }

// Cada achado vira "GS0404@2" (código e linha), na ordem de posição.
export function parseText(text: string): ParsedFile {
  const lexer = createLexer(text);
  const result = parse(text, lexer);
  const table = createLineTable(text);
  const found = [...lexer.diagnostics, ...result.diagnostics]
    .sort((a, b) => a.start - b.start)
    .map((raw) => `${raw.code}@${positionAt(table, raw.start).line}`);
  return { result, found };
}

export function firstExpression(text: string): Expression {
  const [statement] = parseText(text).result.program.body;
  if (statement?.type === 'ExpressionStatement') return statement.expression;
  if (statement?.type === 'VariableDeclaration' && statement.init) return statement.init;
  throw new Error(`o primeiro item não é expressão: ${statement?.type ?? 'nada'}`);
}

export function sexp(expression: Expression, source: string): string {
  switch (expression.type) {
    case 'Identifier': return expression.name;
    case 'Literal': return source.slice(expression.start, expression.end);
    case 'BinaryExpression': return `(${expression.operatorToken.value} ${sexp(expression.left, source)} ${sexp(expression.right, source)})`;
    case 'AssignmentExpression': return `(é ${sexp(expression.left, source)} ${sexp(expression.right, source)})`;
    case 'UnaryExpression': return `(${expression.operatorToken.value} ${sexp(expression.argument, source)})`;
    case 'CallExpression': return `(call ${[expression.callee, ...expression.args].map((e) => sexp(e, source)).join(' ')})`;
    case 'MemberExpression':
      return `(. ${sexp(expression.object, source)} ${'name' in expression.property ? expression.property.name : sexp(expression.property, source)})`;
    case 'ThisExpression': return 'ocê';
    default: return expression.type;
  }
}

export const bodyTypes = (statements: readonly Statement[]): string[] => statements.map((statement) => statement.type);
