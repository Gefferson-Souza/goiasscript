import type { RawDiagnostic, Token } from './token.types.ts';

interface Span { readonly start: number; readonly end: number }

export interface Identifier extends Span { readonly type: 'Identifier'; readonly name: string; readonly reference: boolean }
export interface PropertyName extends Span { readonly type: 'PropertyName'; readonly name: string; readonly keywordToken?: Token }
export interface ErrorNode extends Span { readonly type: 'ErrorNode' }

export interface Literal extends Span { readonly type: 'Literal'; readonly valueToken: Token }
export interface ThisExpression extends Span { readonly type: 'ThisExpression'; readonly keywordToken: Token }
export interface SuperExpression extends Span { readonly type: 'SuperExpression'; readonly keywordToken: Token }
export interface UnaryExpression extends Span { readonly type: 'UnaryExpression'; readonly operatorToken: Token; readonly argument: Expression }
export interface BinaryExpression extends Span {
  readonly type: 'BinaryExpression'; readonly operatorToken: Token; readonly left: Expression; readonly right: Expression;
}
export interface AssignmentExpression extends Span {
  readonly type: 'AssignmentExpression'; readonly assignToken: Token; readonly left: Expression; readonly right: Expression;
}
export interface CallExpression extends Span { readonly type: 'CallExpression'; readonly callee: Expression; readonly args: readonly Expression[] }
export interface MemberExpression extends Span {
  readonly type: 'MemberExpression'; readonly object: Expression; readonly property: PropertyName | Expression; readonly computed: boolean;
}
export interface NewExpression extends Span {
  readonly type: 'NewExpression'; readonly keywordToken: Token; readonly callee: Expression; readonly args: readonly Expression[];
}
export interface ArrayExpression extends Span { readonly type: 'ArrayExpression'; readonly elements: readonly Expression[] }
export interface Property extends Span { readonly type: 'Property'; readonly key: PropertyName | Literal; readonly value: Expression }
export interface ObjectExpression extends Span { readonly type: 'ObjectExpression'; readonly properties: readonly Property[] }
export interface ArrowFunction extends Span {
  readonly type: 'ArrowFunction'; readonly asyncToken?: Token; readonly params: readonly Identifier[]; readonly body: BlockStatement | Expression;
}

export type Expression =
  | Identifier | Literal | ThisExpression | SuperExpression | UnaryExpression | BinaryExpression | AssignmentExpression
  | CallExpression | MemberExpression | NewExpression | ArrayExpression | ObjectExpression | ArrowFunction | ErrorNode;

export interface BlockStatement extends Span { readonly type: 'BlockStatement'; readonly body: readonly Statement[] }
export interface VariableDeclaration extends Span {
  readonly type: 'VariableDeclaration'; readonly declarationToken: Token; readonly id: Identifier; readonly init: Expression | null;
  readonly needsTerminator: boolean;
}
export interface FunctionDeclaration extends Span {
  readonly type: 'FunctionDeclaration'; readonly keywordToken: Token; readonly asyncToken?: Token; readonly id: Identifier;
  readonly params: readonly Identifier[]; readonly body: BlockStatement;
}
export interface MethodDefinition extends Span {
  readonly type: 'MethodDefinition'; readonly key: PropertyName; readonly params: readonly Identifier[]; readonly body: BlockStatement;
  readonly isConstructor: boolean; readonly staticToken?: Token; readonly asyncToken?: Token;
}
export interface ClassDeclaration extends Span {
  readonly type: 'ClassDeclaration'; readonly keywordToken: Token; readonly id: Identifier; readonly extendsToken?: Token;
  readonly superClass: Expression | null; readonly members: readonly MethodDefinition[];
}
export interface IfStatement extends Span {
  readonly type: 'IfStatement'; readonly keywordToken: Token; readonly elseToken?: Token; readonly test: Expression;
  readonly consequent: BlockStatement; readonly alternate: IfStatement | BlockStatement | ErrorNode | null;
}
export interface WhileStatement extends Span {
  readonly type: 'WhileStatement'; readonly keywordToken: Token; readonly test: Expression; readonly body: BlockStatement;
}
export interface ForStatement extends Span {
  readonly type: 'ForStatement'; readonly keywordToken: Token; readonly init: VariableDeclaration | Expression | null;
  readonly test: Expression | null; readonly update: Expression | null; readonly body: BlockStatement;
}
export interface ForEachStatement extends Span {
  readonly type: 'ForEachStatement'; readonly keywordToken: Token; readonly declarationToken: Token; readonly id: Identifier;
  readonly relationToken: Token; readonly right: Expression; readonly body: BlockStatement;
}
export interface CatchClause extends Span {
  readonly type: 'CatchClause'; readonly keywordToken: Token; readonly param: Identifier | null; readonly body: BlockStatement;
}
export interface TryStatement extends Span {
  readonly type: 'TryStatement'; readonly keywordToken: Token; readonly block: BlockStatement; readonly handler: CatchClause | null;
  readonly finalizerToken?: Token; readonly finalizer: BlockStatement | null;
}
export interface ReturnStatement extends Span {
  readonly type: 'ReturnStatement'; readonly keywordToken: Token; readonly argument: Expression | null; readonly needsTerminator: boolean;
}
export interface JumpStatement extends Span { readonly type: 'JumpStatement'; readonly keywordToken: Token; readonly needsTerminator: boolean }
export interface ThrowStatement extends Span {
  readonly type: 'ThrowStatement'; readonly keywordToken: Token; readonly argument: Expression; readonly wrapsInError: boolean;
  readonly needsTerminator: boolean;
}
export interface ExpressionStatement extends Span {
  readonly type: 'ExpressionStatement'; readonly expression: Expression; readonly needsTerminator: boolean;
}

export type Statement =
  | VariableDeclaration | FunctionDeclaration | ClassDeclaration | IfStatement | WhileStatement | ForStatement | ForEachStatement
  | TryStatement | ReturnStatement | JumpStatement | ThrowStatement | ExpressionStatement | BlockStatement | ErrorNode;

export interface Program extends Span { readonly type: 'Program'; readonly body: readonly Statement[] }
export interface ParseResult { readonly program: Program; readonly diagnostics: readonly RawDiagnostic[]; readonly incomplete: boolean }
