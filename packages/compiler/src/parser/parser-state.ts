import { LIMITS } from '@goiasscript/language';
import type { CompileTarget } from '../api.types.ts';
import type { Lexer, RawDiagnostic, Token } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { CODES } from './parser.constants.ts';
import type { NewlineContext } from './newline-context.types.ts';

export class ParserState {
  private contexts: readonly NewlineContext[] = ['statement'];
  private readonly items: RawDiagnostic[] = [];
  private lastKey = '';
  cursor = 0;
  depth = 0;
  lastEnd = 0;
  aborted = false;
  depthReported = false;
  readonly lexer: Lexer;
  readonly source: SourceText;
  readonly target: CompileTarget;

  constructor(lexer: Lexer, source: SourceText, target: CompileTarget) {
    this.lexer = lexer;
    this.source = source;
    this.target = target;
  }

  get top(): NewlineContext {
    return this.contexts.at(-1) ?? 'statement';
  }

  get reported(): readonly RawDiagnostic[] {
    return this.items;
  }

  enter(): boolean {
    this.depth += 1;
    return this.depth <= LIMITS.maxNestingDepth;
  }

  leave(): void {
    this.depth -= 1;
  }

  push(context: NewlineContext): void {
    this.contexts = [...this.contexts, context];
  }

  pop(): void {
    this.contexts = this.contexts.slice(0, -1);
  }

  report(code: string, start: number, end: number, args: Readonly<Record<string, string>> = {}): void {
    if (this.aborted && code !== CODES.tooDeep) return;
    const key = `${code}:${String(start)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.items.push({ code, start, end, args });
  }

  textOf(start: number, end: number): string {
    return this.source.text.slice(start, end);
  }

  current(): Token {
    return this.visibleAt(0);
  }

  visibleAt(count: number): Token {
    return this.lexer.peek(this.offsetOfVisible(count));
  }

  rawPeek(offset: number): Token {
    return this.lexer.peek(offset);
  }

  rawAfter(count: number, ahead = 1): Token {
    return this.lexer.peek(this.offsetOfVisible(count) + ahead);
  }

  advance(): Token {
    const token = this.current();
    this.consumeThrough(token);
    this.cursor += 1;
    this.lastEnd = token.end;
    return token;
  }

  skipNewlines(): void {
    while (this.lexer.peek().kind === 'newline') {
      this.lexer.next();
      this.cursor += 1;
    }
  }

  // O lexer entrega no máximo uma quebra entre dois tokens, então pular uma basta.
  private offsetOfVisible(count: number): number {
    if (this.top !== 'grouping') return count;
    let offset = this.skipNewlineAt(0);
    for (let seen = 0; seen < count; seen += 1) offset = this.skipNewlineAt(offset + 1);
    return offset;
  }

  private skipNewlineAt(offset: number): number {
    return this.lexer.peek(offset).kind === 'newline' ? offset + 1 : offset;
  }

  private consumeThrough(token: Token): void {
    for (;;) {
      const next = this.lexer.next();
      if (next === token || next.kind === 'end-of-file') return;
    }
  }
}
