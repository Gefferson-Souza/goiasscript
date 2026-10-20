import { IDENTIFIER_PATTERN, KEYWORDS, PUNCTUATORS } from './vocabulary.constants.ts';
import type { KeywordInfo, Lexer, RawDiagnostic, Token, TokenKind } from './token.types.ts';

const SPACE = /[ \t\v\f\u00A0\u2000-\u200A\u3000]+/y;
const LINE_COMMENT = /\/\/[^\r\n]*/y;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//y;
const NEWLINE = /\r\n|[\r\n]/y;
const WORD = /[A-Za-z_\u00C0-\u00FF\u0300-\u036F][A-Za-z0-9_\u00C0-\u00FF\u0300-\u036F]*/y;
const NUMBER = /\d+(?:\.\d+)*(?:[eE][+-]?\d+)?/y;
const STRING = /"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'/y;
const TEMPLATE = /`[^`]*(?:`|$)/y;
const LINE_REST = /[^\r\n]*/y;
const PUNCTUATOR = new RegExp(PUNCTUATORS.map((symbol) => symbol.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')).join('|'), 'y');

const BOM = '\uFEFF';
const BLOCK_COMMENT_OPEN = '/*';
const LINE_BREAK = /[\r\n]/;

const LEADING_ZERO = /^0\d/;
const QUOTES = ['"', "'"];

const CODE = {
  malformedNumber: 'GS0101',
  unterminatedString: 'GS0103',
  invalidCharacter: 'GS0104',
  unterminatedBlockComment: 'GS0106',
  unsupportedCharacter: 'GS0107',
} as const;

const MAX_ASCII = 0x7f;

class LexerImpl implements Lexer {
  readonly diagnostics: RawDiagnostic[] = [];
  private readonly buffer: Token[] = [];
  private head = 0;
  private readonly text: string;
  private pos: number;
  private lastWasNewline = false;

  constructor(text: string) {
    this.text = text;
    this.pos = text.startsWith(BOM) ? BOM.length : 0;
  }

  next(): Token {
    const token = this.peek(0);
    this.head += 1;
    if (this.head === this.buffer.length) {
      this.buffer.length = 0;
      this.head = 0;
    }
    return token;
  }

  peek(offset = 0): Token {
    while (this.buffer.length - this.head <= offset) this.buffer.push(this.scan());
    return this.buffer[this.head + offset] as Token;
  }

  private scan(): Token {
    const commentWithNewline = this.skipTrivia();
    if (commentWithNewline !== undefined) return this.make('newline', commentWithNewline);
    const start = this.pos;
    if (this.take(NEWLINE) !== undefined) return this.make('newline', start);
    if (start >= this.text.length) return this.make('end-of-file', start);
    const word = this.take(WORD);
    if (word !== undefined) return this.wordToken(start, word);
    const number = this.take(NUMBER);
    if (number !== undefined) return this.numberToken(start, number);
    if (QUOTES.includes(this.text[start] ?? '')) return this.stringToken(start);
    if (this.take(TEMPLATE) !== undefined) return this.make('template', start);
    if (this.take(PUNCTUATOR) !== undefined) return this.make('punctuator', start);
    return this.invalidCharacter(start);
  }

  private take(pattern: RegExp): string | undefined {
    // eslint-disable-next-line functional/immutable-data -- lastIndex é o cursor do regex sticky
    pattern.lastIndex = this.pos;
    const match = pattern.exec(this.text);
    if (match === null) return undefined;
    this.pos += match[0].length;
    return match[0];
  }

  private report(code: string, start: number, end: number): void {
    this.diagnostics.push({ code, start, end, args: {} });
  }

  private make(kind: TokenKind, start: number, value?: string, keyword?: KeywordInfo): Token {
    const text = this.text.slice(start, this.pos);
    const precededByNewline = this.lastWasNewline;
    this.lastWasNewline = kind === 'newline';
    const base = { kind, start, end: this.pos, text, value: value ?? text, precededByNewline };
    return keyword === undefined ? base : { ...base, keyword };
  }

  // Devolve o início de um comentário de bloco com quebra, que vale como Newline.
  private skipTrivia(): number | undefined {
    for (;;) {
      if (this.take(SPACE) !== undefined || this.take(LINE_COMMENT) !== undefined) continue;
      if (!this.text.startsWith(BLOCK_COMMENT_OPEN, this.pos)) return undefined;
      const start = this.pos;
      const comment = this.take(BLOCK_COMMENT);
      if (comment === undefined) {
        this.pos = this.text.length;
        this.report(CODE.unterminatedBlockComment, start, this.pos);
        return undefined;
      }
      if (LINE_BREAK.test(comment)) return start;
    }
  }

  private wordToken(start: number, raw: string): Token {
    const name = raw.normalize('NFC');
    if (!IDENTIFIER_PATTERN.test(name)) {
      this.report(CODE.invalidCharacter, start, this.pos);
      return this.make('invalid', start);
    }
    const keyword = KEYWORDS.get(name);
    return keyword === undefined ? this.make('identifier', start, name) : this.make('keyword', start, name, keyword);
  }

  private numberToken(start: number, raw: string): Token {
    if (!LEADING_ZERO.test(raw) && raw.split('.').length <= 2) return this.make('number', start);
    this.report(CODE.malformedNumber, start, this.pos);
    return this.make('invalid', start);
  }

  private stringToken(start: number): Token {
    const quoted = this.take(STRING);
    if (quoted !== undefined) return this.make('string', start, quoted.slice(1, -1));
    this.take(LINE_REST);
    this.report(CODE.unterminatedString, start, this.pos);
    return this.make('invalid', start);
  }

  private invalidCharacter(start: number): Token {
    const codePoint = this.text.codePointAt(start) ?? 0;
    this.pos += String.fromCodePoint(codePoint).length;
    const isPlainAscii = codePoint <= MAX_ASCII && this.text[start] !== '$';
    this.report(isPlainAscii ? CODE.unsupportedCharacter : CODE.invalidCharacter, start, this.pos);
    return this.make('invalid', start);
  }
}

export function createLexer(text: string): Lexer {
  return new LexerImpl(text);
}
