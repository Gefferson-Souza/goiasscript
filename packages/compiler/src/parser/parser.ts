import type { AstNode, ErrorNode, Expression, ParseOptions, ParseResult, Program } from '../ast/ast.types.ts';
import { forEachChild } from '../ast/walk.ts';
import { LIMITS } from '@goiasscript/language';
import type { Lexer, RawDiagnostic } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { parseExpression } from './expressions.ts';
import { ParserState } from './parser-state.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { errorNode, reportUnexpected, isStatementStart } from './recovery.ts';
import { parseBlock, parseStatement, parseStatements } from './statements.ts';

const INCOMPLETE_CODES: ReadonlySet<string> = new Set([CODES.unexpectedEnd, CODES.unterminatedComment]);

class ParserImpl implements Parser {
  readonly state: ParserState;
  private readonly heights = new WeakMap<AstNode, number>();

  constructor(state: ParserState) {
    this.state = state;
  }

  parseExpression(minimum = 0): Expression {
    return parseExpression(this, minimum);
  }

  parseStatement() {
    return parseStatement(this);
  }

  parseBlock() {
    return parseBlock(this);
  }

  nested<T>(start: number, parse: () => T, fallback: T): T {
    if (!this.state.enter()) {
      this.state.leave();
      this.abort(start);
      return fallback;
    }
    const result = parse();
    this.state.leave();
    return result;
  }

  build(node: Expression): Expression {
    let tallest = 0;
    forEachChild(node, (child) => {
      tallest = Math.max(tallest, this.heights.get(child) ?? 0);
    });
    // Altura = níveis empilhados a partir da folha mais funda; o excedente vira ErrorNode.
    const height = tallest + 1;
    if (this.state.depth + height > LIMITS.maxNestingDepth) {
      this.reportDepth(node.start, node.end);
      return errorNode(CODES.tooDeep, node.start, node.end);
    }
    this.heights.set(node, height);
    return node;
  }

  // Não consome o resto da entrada: todo laço do parser sai com `aborted`, e ler mais tokens não muda o diagnóstico.
  private abort(start: number): void {
    const end = this.state.rawPeek(0).end;
    this.reportDepth(start, end);
    this.state.aborted = true;
  }

  private reportDepth(start: number, end: number): void {
    if (this.state.depthReported) return;
    this.state.depthReported = true;
    this.state.report(CODES.tooDeep, start, end, { limit: String(LIMITS.maxNestingDepth) });
  }

  unexpected(): ErrorNode {
    const token = reportUnexpected(this);
    const code = token.kind === 'end-of-file' ? CODES.unexpectedEnd : CODES.unexpected;
    const node = errorNode(code, token.start, token.end);
    if (!isBoundary(this, token)) this.state.advance();
    return node;
  }
}

function isBoundary(parser: Parser, token: ReturnType<ParserState['current']>): boolean {
  const closer = parser.state.top === 'grouping' && token.kind === 'punctuator' && (token.value === ')' || token.value === ']');
  const structural = token.kind === 'punctuator' && (token.value === '}' || token.value === ';');
  return closer || structural || token.kind === 'newline' || token.kind === 'end-of-file' || isStatementStart(token);
}

const byStart = (left: RawDiagnostic, right: RawDiagnostic): number => left.start - right.start;

export function parse(source: SourceText, lexer: Lexer, options: ParseOptions): ParseResult {
  const parser = new ParserImpl(new ParserState(lexer, source, options.target));
  const body = parseStatements(parser, 'program');
  const program: Program = { type: 'Program', body, start: 0, end: source.text.length };
  const diagnostics = [...lexer.diagnostics, ...parser.state.reported].sort(byStart);
  const incomplete = options.target === 'repl' && diagnostics.length > 0 && diagnostics.every((item) => INCOMPLETE_CODES.has(item.code));
  return { program, diagnostics, incomplete };
}
