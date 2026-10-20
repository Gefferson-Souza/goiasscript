import type { Lexer, RawDiagnostic, Token } from './token.types.ts';
import type * as Ast from './ast.types.ts';
import { JS_KEYWORD_EQUIVALENT, JS_OPERATOR_FORMS, KEYWORDS, MAX_NESTING_DEPTH } from './vocabulary.constants.ts';

type Context = 'statement' | 'grouping';

export const CODE = {
  unexpectedEnd: 'GS0201', unexpectedToken: 'GS0202', leadingOperator: 'GS0203', brokenArrow: 'GS0204', danglingContinuation: 'GS0205',
  throwShape: 'GS0206', missingBraces: 'GS0207', decimalComma: 'GS0208', badTarget: 'GS0209', reservedName: 'GS0303',
  constWithoutValue: 'GS0307', jsKeyword: 'GS0401', jsGlobal: 'GS0403', jsOperator: 'GS0404', unsupported: 'GS0500',
  unterminatedComment: 'GS0106',
} as const;

export const INCOMPLETE_CODES: ReadonlySet<string> = new Set([CODE.unexpectedEnd, CODE.unterminatedComment]);

export const isKeyword = (token: Token, spelling: string): boolean => token.kind === 'keyword' && token.keyword?.spelling === spelling;
export const isPunct = (token: Token, text: string): boolean => token.kind === 'punctuator' && token.text === text;
export const endsSimple = (token: Token): boolean => token.kind === 'newline' || token.kind === 'end-of-file' || isPunct(token, ';') || isPunct(token, '}');

export abstract class ParserBase {
  readonly diagnostics: RawDiagnostic[] = [];
  protected readonly contexts: Context[] = ['statement'];
  protected readonly catchParams: string[] = [];
  protected readonly lexer: Lexer;
  protected readonly textLength: number;
  protected previousEnd = 0;
  protected consumed = 0;
  protected depth = 0;
  protected muted = false;
  private readonly reportedStarts = new Set<number>();
  private readonly swapped = new WeakMap<Token, Token>();
  private depthReported = false;
  private previous: Token | undefined;

  constructor(lexer: Lexer, textLength: number) {
    this.lexer = lexer;
    this.textLength = textLength;
  }


  protected curRaw(): Token {
    while (this.contexts.at(-1) === 'grouping' && this.lexer.peek().kind === 'newline') this.drop();
    return this.lexer.peek();
  }

  protected cur(): Token {
    return this.swapJsWord(this.curRaw());
  }

  protected drop(): Token {
    this.consumed += 1;
    return this.lexer.next();
  }

  protected advance(): Token {
    const token = this.cur();
    return this.take(token);
  }

  protected advanceRaw(): Token {
    return this.take(this.curRaw());
  }

  protected take(token: Token): Token {
    this.drop();
    this.previous = token;
    this.previousEnd = token.end;
    return token;
  }

  protected skipNewlines(): void {
    while (this.lexer.peek().kind === 'newline') this.drop();
  }

  protected skipSeparators(): void {
    while (this.lexer.peek().kind === 'newline' || isPunct(this.lexer.peek(), ';')) this.drop();
  }

  // Primeiro token que não é quebra de linha, a partir do cursor, sem consumir.
  protected lookahead(count: number): Token {
    let seen = 0;
    for (let offset = 0; ; offset += 1) {
      const token = this.lexer.peek(offset);
      if (token.kind === 'end-of-file') return token;
      if (token.kind === 'newline') continue;
      if (seen === count) return token;
      seen += 1;
    }
  }

  protected withContext<T>(context: Context, parse: () => T): T {
    this.contexts.push(context);
    const result = parse();
    this.contexts.pop();
    return result;
  }

  protected report(code: string, start: number, end: number, args: Readonly<Record<string, string>> = {}): void {
    if (this.muted || this.reportedStarts.has(start)) return;
    this.reportedStarts.add(start);
    this.diagnostics.push({ code, start, end, args });
  }

  protected reportUnexpected(token: Token): void {
    const code = token.kind === 'end-of-file' ? CODE.unexpectedEnd : CODE.unexpectedToken;
    this.report(code, token.start, token.end, { token: token.text });
  }

  protected reportJsOperator(token: Token): void {
    const form = token.kind === 'punctuator' ? JS_OPERATOR_FORMS.get(token.text) : undefined;
    if (form !== undefined) this.report(CODE.jsOperator, token.start, token.end, { operator: token.text, suggestion: form });
  }

  // Descarta até o fim da instrução e silencia a cascata de erros dela.
  protected synchronize(): void {
    this.muted = true;
    for (;;) {
      const token = this.lexer.peek();
      if (token.kind === 'end-of-file' || token.kind === 'newline' || isPunct(token, ';') || isPunct(token, '}')) return;
      this.drop();
    }
  }

  protected expectPunct(text: string): Token | undefined {
    const token = this.cur();
    if (isPunct(token, text)) return this.advance();
    this.reportUnexpected(token);
    return undefined;
  }

  protected errorNode(start: number, end: number): Ast.ErrorNode {
    return { type: 'ErrorNode', start, end };
  }

  protected reportDepth(token: Token): void {
    if (this.depthReported) return;
    this.depthReported = true;
    this.muted = false;
    this.report(CODE.unsupported, token.start, token.end, { limit: String(MAX_NESTING_DEPTH) });
  }

  protected nested<T extends Ast.Statement | Ast.Expression>(parse: () => T): T | Ast.ErrorNode {
    this.depth += 1;
    if (this.depth > MAX_NESTING_DEPTH) {
      this.depth -= 1;
      const token = this.lexer.peek();
      this.reportDepth(token);
      this.synchronize();
      return this.errorNode(token.start, token.start);
    }
    const result = parse();
    this.depth -= 1;
    return result;
  }

  protected swapJsWord(token: Token): Token {
    const goiano = token.kind === 'identifier' ? JS_KEYWORD_EQUIVALENT.get(token.value) : undefined;
    const keyword = goiano ? KEYWORDS.get(goiano) : undefined;
    if (!goiano || !keyword) return token;
    const cached = this.swapped.get(token);
    if (cached) return cached;
    this.report(CODE.jsKeyword, token.start, token.end, { word: token.value, suggestion: goiano });
    const replacement: Token = { ...token, kind: 'keyword', keyword };
    this.swapped.set(token, replacement);
    return replacement;
  }

  // Devolve true quando a emissão precisa inserir o `;`.
  protected finishSimple(): boolean {
    const token = this.cur();
    if (isPunct(token, ';')) {
      this.advance();
      return false;
    }
    if (token.kind === 'newline') {
      this.advance();
      return true;
    }
    if (endsSimple(token)) return true;
    this.reportBadEnd(token);
    this.synchronize();
    return true;
  }

  protected endOfSimple(): { readonly end: number; readonly needsTerminator: boolean } {
    const end = this.previousEnd;
    return { end, needsTerminator: this.finishSimple() };
  }

  protected reportBadEnd(token: Token): void {
    const next = this.lookahead(1);
    if (isPunct(token, ',') && this.previous?.kind === 'number' && next.kind === 'number') {
      this.report(CODE.decimalComma, this.previous.start, next.end);
      return;
    }
    this.reportUnexpected(token);
  }

}
