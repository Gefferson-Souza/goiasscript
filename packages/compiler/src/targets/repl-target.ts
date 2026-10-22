import type { CompileTarget } from '../api.types.ts';
import type { AstNode, ClassDeclaration, FunctionDeclaration, Program, Statement, VariableDeclaration } from '../ast/ast.types.ts';
import { isAskCall } from '../lowering/await-edits.ts';
import type { Edit, EditContext } from '../lowering/edit.types.ts';
import { lineBreaksOf } from '../lowering/line-breaks.ts';
import { childrenOf } from '../ast/walk.ts';
import { STRICT_DIRECTIVE } from './playground-target.ts';

const ASYNC_OPENING = '(async () => { ';
const ASYNC_CLOSING = '\n})()';
const UNDEFINED_VALUE = ' = undefined';
const FUNCTION_NODE_TYPES: ReadonlySet<string> = new Set(['FunctionDeclaration', 'ArrowFunctionExpression', 'MethodDefinition']);

export const isReplDeclaration = (node: AstNode, parent: AstNode | null, target: CompileTarget): boolean =>
  target === 'repl' && parent?.type === 'Program' && (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration');

function containsTopLevelAsk(node: AstNode, context: EditContext): boolean {
  if (FUNCTION_NODE_TYPES.has(node.type)) return false;
  if (node.type === 'CallExpression' && isAskCall(node, context)) return true;
  return childrenOf(node).some((child) => containsTopLevelAsk(child, context));
}

export const needsAsyncWrapper = (program: Program, context: EditContext): boolean =>
  context.analysis.hasTopLevelAwait || containsTopLevelAsk(program, context);

function newBindingNames(context: EditContext): readonly string[] {
  const known = new Set((context.session?.bindings ?? []).map((binding) => binding.name));
  return context.analysis.topLevelBindings.map((binding) => binding.name).filter((name) => !known.has(name));
}

function variableEdits(declaration: VariableDeclaration, context: EditContext): readonly Edit[] {
  const [first] = declaration.declarations;
  if (first === undefined) return [];
  const gap = context.source.text.slice(declaration.keywordToken.start, first.id.start);
  const removal: Edit = { start: declaration.keywordToken.start, end: first.id.start, text: lineBreaksOf(gap), order: context.nextOrder() };
  const defaults = declaration.declarations.flatMap((declarator): readonly Edit[] =>
    declarator.init === null ? [{ start: declarator.end, end: declarator.end, text: UNDEFINED_VALUE, order: context.nextOrder() }] : [],
  );
  return [removal, ...defaults];
}

function bindingEdits(declaration: FunctionDeclaration | ClassDeclaration, context: EditContext): readonly Edit[] {
  return [
    { start: declaration.start, end: declaration.start, text: `${declaration.id.name} = `, order: context.nextOrder() },
    { start: declaration.end, end: declaration.end, text: ';', order: context.nextOrder() },
  ];
}

function declarationEdits(statement: Statement, context: EditContext): readonly Edit[] {
  if (statement.type === 'VariableDeclaration') return variableEdits(statement, context);
  return statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration' ? bindingEdits(statement, context) : [];
}

export function replOpeningEdits(program: Program, context: EditContext): readonly Edit[] {
  const wrapped = needsAsyncWrapper(program, context);
  const names = newBindingNames(context);
  const prefix = `${STRICT_DIRECTIVE}${names.length > 0 ? `let ${names.join(', ')}; ` : ''}${wrapped ? ASYNC_OPENING : ''}`;
  const opening: Edit = { start: 0, end: 0, text: prefix, order: context.nextOrder() };
  const last = context.analysis.lastTopLevelExpression;
  const echo: readonly Edit[] = wrapped && last !== undefined ? [{ start: last.start, end: last.start, text: 'return ', order: context.nextOrder() }] : [];
  return [opening, ...program.body.flatMap((statement) => declarationEdits(statement, context)), ...echo];
}

export function replClosingEdits(program: Program, context: EditContext): readonly Edit[] {
  const end = context.source.text.length;
  return needsAsyncWrapper(program, context) ? [{ start: end, end, text: ASYNC_CLOSING, order: context.nextOrder() }] : [];
}
