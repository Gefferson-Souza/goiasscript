import type { AstNode } from './ast.types.ts';

const CHILD_KEYS: Readonly<Record<AstNode['type'], readonly string[]>> = {
  Program: ['body'],
  BlockStatement: ['body'],
  ExpressionStatement: ['expression'],
  VariableDeclaration: ['declarations'],
  VariableDeclarator: ['id', 'init'],
  FunctionDeclaration: ['id', 'params', 'body'],
  MethodDefinition: ['key', 'params', 'body'],
  ClassDeclaration: ['id', 'superClass', 'body'],
  IfStatement: ['test', 'consequent', 'alternate'],
  WhileStatement: ['test', 'body'],
  ForStatement: ['init', 'test', 'update', 'body'],
  ForOfStatement: ['left', 'right', 'body'],
  ForInStatement: ['left', 'right', 'body'],
  BreakStatement: [],
  ContinueStatement: [],
  ReturnStatement: ['argument'],
  ThrowStatement: ['arguments'],
  TryStatement: ['block', 'handler', 'finalizer'],
  CatchClause: ['param', 'body'],
  Identifier: [],
  Literal: [],
  ErrorNode: [],
  ThisExpression: [],
  Super: [],
  ArrayExpression: ['elements'],
  ObjectExpression: ['properties'],
  Property: ['key', 'value'],
  MemberExpression: ['object', 'property'],
  CallExpression: ['callee', 'arguments'],
  NewExpression: ['callee', 'arguments'],
  UnaryExpression: ['argument'],
  AwaitExpression: ['argument'],
  BinaryExpression: ['left', 'right'],
  LogicalExpression: ['left', 'right'],
  AssignmentExpression: ['left', 'right'],
  ArrowFunctionExpression: ['params', 'body'],
};

function isAstNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}

export function forEachChild(node: AstNode, visit: (child: AstNode) => void): void {
  const fields = node as unknown as Readonly<Record<string, unknown>>;
  for (const key of CHILD_KEYS[node.type]) {
    const value = fields[key];
    const candidates: readonly unknown[] = Array.isArray(value) ? (value as readonly unknown[]) : [value];
    for (const child of candidates) if (isAstNode(child)) visit(child);
  }
}

export function walk(node: AstNode, visit: (node: AstNode) => void): void {
  visit(node);
  forEachChild(node, (child) => {
    walk(child, visit);
  });
}
