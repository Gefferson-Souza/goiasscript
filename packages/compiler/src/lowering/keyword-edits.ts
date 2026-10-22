import type { AstNode, UnaryExpression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { isReplDeclaration } from '../targets/repl-target.ts';
import type { Edit, EditContext } from './edit.types.ts';
import { keywordInGap } from './keyword-gaps.ts';
import { needsSpace } from './token-separation.ts';

const HORIZONTAL_SPACE = /^[ \t]*$/u;

const optionalEdit = (edit: Edit | undefined): readonly Edit[] => (edit === undefined ? [] : [edit]);
const optionalToken = (token: Token | undefined): readonly Token[] => (token === undefined ? [] : [token]);

function tokensOf(node: AstNode, parent: AstNode | null, context: EditContext): readonly Token[] {
  if (node.type === 'ThrowStatement' || node.type === 'UnaryExpression') return [];
  if (node.type === 'VariableDeclaration' && isReplDeclaration(node, parent, context.target)) return [];
  return [
    ...('keywordToken' in node ? optionalToken(node.keywordToken) : []),
    ...('asyncToken' in node ? optionalToken(node.asyncToken) : []),
    ...('keywordTokens' in node ? node.keywordTokens : []),
    ...('operatorToken' in node ? [node.operatorToken] : []),
  ];
}

function replacementFor(token: Token, context: EditContext): Edit | undefined {
  const { keyword } = token;
  if (keyword === undefined) return undefined;
  const { text } = context.source;
  const spacer = needsSpace(text.charAt(token.start - 1), keyword.js, text.charAt(token.end)) ? ' ' : '';
  return { start: token.start, end: token.end, text: `${keyword.js}${spacer}`, order: context.nextOrder() };
}

// `num_é x` e `menos 1` colam no operando: `!x`, `-1`.
function unaryEdits(node: UnaryExpression, context: EditContext): readonly Edit[] {
  const { keyword } = node.operatorToken;
  if (keyword === undefined) return [];
  const { text } = context.source;
  const gap = text.slice(node.operatorToken.end, node.argument.start);
  const end = HORIZONTAL_SPACE.test(gap) ? node.argument.start : node.operatorToken.end;
  const spacer = needsSpace(text.charAt(node.operatorToken.start - 1), keyword.js, text.charAt(end)) ? ' ' : '';
  return [{ start: node.operatorToken.start, end, text: `${keyword.js}${spacer}`, order: context.nextOrder() }];
}

function gapToken(node: AstNode, context: EditContext): Token | undefined {
  const { source } = context;
  switch (node.type) {
    case 'VariableDeclarator':
      return node.init === null ? undefined : keywordInGap(source, node.id.end, node.init.start);
    case 'IfStatement':
      return node.alternate?.type === 'BlockStatement' ? keywordInGap(source, node.consequent.end, node.alternate.start) : undefined;
    case 'TryStatement':
      return node.finalizer === null ? undefined : keywordInGap(source, (node.handler ?? node.block).end, node.finalizer.start);
    case 'ClassDeclaration':
      return node.superClass === null ? undefined : keywordInGap(source, node.id.end, node.superClass.start);
    case 'ForOfStatement':
    case 'ForInStatement':
      return keywordInGap(source, node.left.end, node.right.start);
    default:
      return undefined;
  }
}

export function keywordEdits(node: AstNode, parent: AstNode | null, context: EditContext): readonly Edit[] {
  const tokens = [...tokensOf(node, parent, context), ...optionalToken(gapToken(node, context))];
  const edits = tokens.flatMap((token) => optionalEdit(replacementFor(token, context)));
  return node.type === 'UnaryExpression' ? [...edits, ...unaryEdits(node, context)] : edits;
}
