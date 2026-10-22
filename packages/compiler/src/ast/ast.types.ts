import type { KeywordEntry } from '@goiasscript/language';
import type { CompileTarget } from '../api.types.ts';
import type { RawDiagnostic, Token } from '../lexer/token.types.ts';

interface NodeBase {
  readonly start: number;
  readonly end: number;
}

export interface Identifier extends NodeBase {
  readonly type: 'Identifier';
  readonly name: string;
  readonly reservedKeyword?: KeywordEntry;
}
export interface Literal extends NodeBase {
  readonly type: 'Literal';
  readonly raw: string;
  readonly value: string | number | boolean | null | undefined;
  readonly keywordToken?: Token;
}
export interface ErrorNode extends NodeBase {
  readonly type: 'ErrorNode';
  readonly code: string;
}
export interface ThisExpression extends NodeBase {
  readonly type: 'ThisExpression';
  readonly keywordToken: Token;
}
export interface Super extends NodeBase {
  readonly type: 'Super';
  readonly keywordToken: Token;
}
export interface ArrayExpression extends NodeBase {
  readonly type: 'ArrayExpression';
  readonly elements: readonly Expression[];
}
export interface Property extends NodeBase {
  readonly type: 'Property';
  readonly key: Identifier | Literal;
  readonly value: Expression;
}
export interface ObjectExpression extends NodeBase {
  readonly type: 'ObjectExpression';
  readonly properties: readonly Property[];
}
export interface MemberExpression extends NodeBase {
  readonly type: 'MemberExpression';
  readonly object: Expression;
  readonly property: Expression;
  readonly computed: boolean;
}
export interface CallExpression extends NodeBase {
  readonly type: 'CallExpression';
  readonly callee: Expression;
  readonly arguments: readonly Expression[];
}
export interface NewExpression extends NodeBase {
  readonly type: 'NewExpression';
  readonly callee: Expression;
  readonly arguments: readonly Expression[];
  readonly keywordToken: Token;
}
export interface UnaryExpression extends NodeBase {
  readonly type: 'UnaryExpression';
  readonly operator: string;
  readonly argument: Expression;
  readonly operatorToken: Token;
}
export interface AwaitExpression extends NodeBase {
  readonly type: 'AwaitExpression';
  readonly argument: Expression;
  readonly keywordToken: Token;
}
export interface BinaryExpression extends NodeBase {
  readonly type: 'BinaryExpression' | 'LogicalExpression';
  readonly operator: string;
  readonly left: Expression;
  readonly right: Expression;
  readonly operatorToken: Token;
}
export interface AssignmentExpression extends NodeBase {
  readonly type: 'AssignmentExpression';
  readonly operator: string;
  readonly left: Expression;
  readonly right: Expression;
  readonly operatorToken: Token;
}
export interface ArrowFunctionExpression extends NodeBase {
  readonly type: 'ArrowFunctionExpression';
  readonly params: readonly Identifier[];
  readonly body: BlockStatement | Expression;
  readonly async: boolean;
  readonly keywordToken?: Token;
}
export type Expression =
  | Identifier
  | Literal
  | ErrorNode
  | ThisExpression
  | Super
  | ArrayExpression
  | ObjectExpression
  | MemberExpression
  | CallExpression
  | NewExpression
  | UnaryExpression
  | AwaitExpression
  | BinaryExpression
  | AssignmentExpression
  | ArrowFunctionExpression;

export interface BlockStatement extends NodeBase {
  readonly type: 'BlockStatement';
  readonly body: readonly Statement[];
  readonly synthetic?: boolean;
}
export interface ExpressionStatement extends NodeBase {
  readonly type: 'ExpressionStatement';
  readonly expression: Expression;
}
export interface VariableDeclarator extends NodeBase {
  readonly type: 'VariableDeclarator';
  readonly id: Identifier;
  readonly init: Expression | null;
}
export interface VariableDeclaration extends NodeBase {
  readonly type: 'VariableDeclaration';
  readonly kind: 'const' | 'let';
  readonly declarations: readonly VariableDeclarator[];
  readonly keywordToken: Token;
}
export interface FunctionDeclaration extends NodeBase {
  readonly type: 'FunctionDeclaration';
  readonly id: Identifier;
  readonly params: readonly Identifier[];
  readonly body: BlockStatement;
  readonly async: boolean;
  readonly keywordToken: Token;
  readonly asyncToken?: Token;
}
export interface MethodDefinition extends NodeBase {
  readonly type: 'MethodDefinition';
  readonly key: Identifier;
  readonly params: readonly Identifier[];
  readonly body: BlockStatement;
  readonly kind: 'constructor' | 'method';
  readonly static: boolean;
  readonly async: boolean;
  readonly keywordTokens: readonly Token[];
}
export interface ClassDeclaration extends NodeBase {
  readonly type: 'ClassDeclaration';
  readonly id: Identifier;
  readonly superClass: Expression | null;
  readonly body: readonly MethodDefinition[];
  readonly keywordToken: Token;
}
export interface IfStatement extends NodeBase {
  readonly type: 'IfStatement';
  readonly test: Expression;
  readonly consequent: BlockStatement;
  readonly alternate: IfStatement | BlockStatement | null;
  readonly keywordToken: Token;
}
export interface WhileStatement extends NodeBase {
  readonly type: 'WhileStatement';
  readonly test: Expression;
  readonly body: BlockStatement;
  readonly keywordToken: Token;
}
export interface ForStatement extends NodeBase {
  readonly type: 'ForStatement';
  readonly init: VariableDeclaration | Expression | null;
  readonly test: Expression | null;
  readonly update: Expression | null;
  readonly body: BlockStatement;
  readonly keywordToken: Token;
}
export interface ForEachStatement extends NodeBase {
  readonly type: 'ForOfStatement' | 'ForInStatement';
  readonly left: VariableDeclaration;
  readonly right: Expression;
  readonly body: BlockStatement;
  readonly keywordToken: Token;
}
export interface JumpStatement extends NodeBase {
  readonly type: 'BreakStatement' | 'ContinueStatement';
  readonly keywordToken: Token;
}
export interface ReturnStatement extends NodeBase {
  readonly type: 'ReturnStatement';
  readonly argument: Expression | null;
  readonly keywordToken: Token;
}
export interface ThrowStatement extends NodeBase {
  readonly type: 'ThrowStatement';
  readonly arguments: readonly Expression[];
  readonly keywordToken: Token;
}
export interface CatchClause extends NodeBase {
  readonly type: 'CatchClause';
  readonly param: Identifier | null;
  readonly body: BlockStatement;
  readonly keywordToken: Token;
}
export interface TryStatement extends NodeBase {
  readonly type: 'TryStatement';
  readonly block: BlockStatement;
  readonly handler: CatchClause | null;
  readonly finalizer: BlockStatement | null;
  readonly keywordToken: Token;
}
export type Statement =
  | BlockStatement
  | ExpressionStatement
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | IfStatement
  | WhileStatement
  | ForStatement
  | ForEachStatement
  | JumpStatement
  | ReturnStatement
  | ThrowStatement
  | TryStatement
  | ErrorNode;
export interface Program extends NodeBase {
  readonly type: 'Program';
  readonly body: readonly Statement[];
}
export type AstNode = Program | Statement | Expression | Property | VariableDeclarator | MethodDefinition | CatchClause;

export interface ParseOptions {
  readonly target: CompileTarget;
}
export interface ParseResult {
  readonly program: Program;
  readonly diagnostics: readonly RawDiagnostic[];
  readonly incomplete: boolean;
}
