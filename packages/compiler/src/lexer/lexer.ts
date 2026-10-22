import type { SourceText } from '../source/source.types.ts';
import { regexEnd } from './rescan-regex.ts';
import { scanCode } from './scan-dispatch.ts';
import { scanTrivia } from './scan-trivia.ts';
import type { Lexer, RawDiagnostic, ScanContext, ScannedToken, TextSpan, Token, TriviaStep } from './token.types.ts';

export function createLexer(source: SourceText): Lexer {
  return new LexerImpl(source);
}

class LexerImpl implements Lexer {
  private position = 0;
  private buffer: readonly Token[] = [];
  private items: RawDiagnostic[] = [];
  private newlineEmitted = false;
  private readonly context: ScanContext;
  private readonly source: SourceText;

  constructor(source: SourceText) {
    this.source = source;
    this.context = {
      text: source.text,
      report: (code, start, end, args = {}) => {
        this.items.push({ code, start, end, args });
      },
    };
  }

  get diagnostics(): readonly RawDiagnostic[] {
    return this.items;
  }

  next(): Token {
    const buffered = this.buffer[0];
    if (buffered === undefined) return this.scan();
    this.buffer = this.buffer.slice(1);
    return buffered;
  }

  peek(offset = 0): Token {
    while (this.buffer.length <= offset) this.buffer = [...this.buffer, this.scan()];
    return this.buffer[offset] ?? this.scan();
  }

  rescanAsRegex(token: Token): Token {
    const closing = regexEnd(this.source.text, token.start);
    const end = closing < 0 ? token.start + 1 : closing;
    const text = this.source.text.slice(token.start, end);
    this.position = end;
    this.buffer = [];
    this.items = this.items.filter((item) => item.start < token.start);
    this.newlineEmitted = false;
    return { ...token, kind: 'invalid', end, text, value: text };
  }

  private scan(): Token {
    const step = scanTrivia(this.context, this.position, this.newlineEmitted);
    const precededByNewline = this.newlineEmitted;
    if (step.newline !== null) return this.emitNewline(step, step.newline);
    const scanned = this.scanAt(step);
    this.newlineEmitted = false;
    this.position = scanned.end;
    return this.build(step, scanned, precededByNewline);
  }

  private scanAt(step: TriviaStep): ScannedToken {
    if (step.unterminatedComment !== null) {
      const { start, end } = step.unterminatedComment;
      return { kind: 'invalid', end, value: this.source.text.slice(start, end) };
    }
    return step.end >= this.source.text.length ? { kind: 'end-of-file', end: step.end, value: '' } : scanCode(this.context, step.end);
  }

  private emitNewline(step: TriviaStep, span: TextSpan): Token {
    const text = this.source.text.slice(span.start, span.end);
    this.newlineEmitted = true;
    this.position = span.end;
    return { kind: 'newline', start: span.start, end: span.end, text, value: text, precededByNewline: false, leadingTrivia: step.trivia };
  }

  private build(step: TriviaStep, scanned: ScannedToken, precededByNewline: boolean): Token {
    const text = this.source.text.slice(step.end, scanned.end);
    const base = { kind: scanned.kind, start: step.end, end: scanned.end, text, value: scanned.value, precededByNewline, leadingTrivia: step.trivia };
    if (scanned.keyword === undefined && scanned.numberForm === undefined) return base;
    return {
      ...base,
      ...(scanned.keyword === undefined ? {} : { keyword: scanned.keyword }),
      ...(scanned.numberForm === undefined ? {} : { numberForm: scanned.numberForm }),
    };
  }
}
