import { isForbiddenSeparator, isLineBreak, isTriviaSpace } from './char-classes.ts';
import type { ScanContext, TextSpan, Trivia, TriviaKind, TriviaStep } from './token.types.ts';

const BYTE_ORDER_MARK = '\ufeff';
const LINE_COMMENT_OPENER = '//';
const BLOCK_COMMENT_OPENER = '/*';
const BLOCK_COMMENT_CLOSER = '*/';

class TriviaScanner {
  private readonly items: Trivia[] = [];
  private index: number;
  private newline: TextSpan | null = null;
  private unterminatedComment: TextSpan | null = null;
  private readonly context: ScanContext;
  private readonly swallowNewlines: boolean;

  constructor(context: ScanContext, from: number, swallowNewlines: boolean) {
    this.context = context;
    this.index = from;
    this.swallowNewlines = swallowNewlines;
  }

  run(): TriviaStep {
    let advancing = true;
    while (advancing) advancing = this.step();
    return { trivia: this.items, end: this.index, newline: this.newline, unterminatedComment: this.unterminatedComment };
  }

  private step(): boolean {
    const { text } = this.context;
    const character = text[this.index];
    if (character === undefined) return false;
    if (character === BYTE_ORDER_MARK && this.index === 0) return this.add('bom', 1, false);
    if (isTriviaSpace(character) || (this.swallowNewlines && isLineBreak(character))) return this.scanSpaces();
    if (isLineBreak(character)) return this.stopAtLineBreak();
    if (text.startsWith(LINE_COMMENT_OPENER, this.index)) return this.scanLineComment();
    if (text.startsWith(BLOCK_COMMENT_OPENER, this.index)) return this.scanBlockComment();
    return false;
  }

  private add(kind: TriviaKind, length: number, containsNewline: boolean): boolean {
    this.items.push({ kind, start: this.index, end: this.index + length, containsNewline });
    this.index += length;
    return true;
  }

  private scanSpaces(): boolean {
    const { text } = this.context;
    let end = this.index;
    let containsNewline = false;
    while (isTriviaSpace(text[end]) || (this.swallowNewlines && isLineBreak(text[end]))) {
      containsNewline = containsNewline || isLineBreak(text[end]);
      end += 1;
    }
    return this.add('whitespace', end - this.index, containsNewline);
  }

  private stopAtLineBreak(): boolean {
    const { text } = this.context;
    const length = text.startsWith('\r\n', this.index) ? 2 : 1;
    this.newline = { start: this.index, end: this.index + length };
    return false;
  }

  private scanLineComment(): boolean {
    const { text } = this.context;
    let end = this.index + LINE_COMMENT_OPENER.length;
    while (end < text.length && !isLineBreak(text[end])) {
      if (isForbiddenSeparator(text[end])) this.context.report('GS0105', end, end + 1);
      end += 1;
    }
    return this.add('line-comment', end - this.index, false);
  }

  private scanBlockComment(): boolean {
    const { text } = this.context;
    const bodyStart = this.index + BLOCK_COMMENT_OPENER.length;
    const closer = text.indexOf(BLOCK_COMMENT_CLOSER, bodyStart);
    const end = closer < 0 ? text.length : closer + BLOCK_COMMENT_CLOSER.length;
    if (closer < 0) {
      this.context.report('GS0106', this.index, end);
      this.unterminatedComment = { start: this.index, end };
      return false;
    }
    const containsNewline = this.inspectBlockBody(bodyStart, closer);
    if (containsNewline && !this.swallowNewlines) {
      this.newline = { start: this.index, end };
      return false;
    }
    return this.add('block-comment', end - this.index, containsNewline);
  }

  private inspectBlockBody(from: number, to: number): boolean {
    const { text } = this.context;
    let containsNewline = false;
    for (let position = from; position < to; position += 1) {
      containsNewline = containsNewline || isLineBreak(text[position]);
      if (isForbiddenSeparator(text[position])) this.context.report('GS0105', position, position + 1);
    }
    return containsNewline;
  }
}

export function scanTrivia(context: ScanContext, from: number, swallowNewlines: boolean): TriviaStep {
  return new TriviaScanner(context, from, swallowNewlines).run();
}
