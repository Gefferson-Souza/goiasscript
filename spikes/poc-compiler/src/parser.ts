import type * as Ast from './ast.types.ts';
import type { Lexer, Token } from './token.types.ts';
import { CODE, INCOMPLETE_CODES, ParserBase, endsSimple, isKeyword, isPunct } from './parser-base.ts';
import {
  ASSIGNMENT_PUNCTUATORS, BINARY_ONLY_PUNCTUATORS, BINARY_PRECEDENCE, JS_GLOBALS, MAX_NESTING_DEPTH, PRECEDENCE_ASSIGNMENT, PRECEDENCE_UNARY,
} from './vocabulary.constants.ts';

type ForHeader =
  | Pick<Ast.ForStatement, 'init' | 'test' | 'update'>
  | Pick<Ast.ForEachStatement, 'declarationToken' | 'id' | 'relationToken' | 'right'>;
type ArrowShape = { readonly state: 'arrow' | 'broken' | 'none'; readonly newline?: Token };

const LITERAL_WORDS: ReadonlySet<string> = new Set(['certeza', 'de_jeito_nenhum', 'nada', 'indefinido']);
const PREFIX_WORDS: ReadonlySet<string> = new Set(['num_é', 'menos', 'espera_um_cadim']);
const FOR_RELATIONS: readonly string[] = ['de', 'em'];

const isDeclaration = (token: Token): boolean => isKeyword(token, 'uai') || isKeyword(token, 'trem');

class Parser extends ParserBase {
  parseProgram(): Ast.Program {
    const body: Ast.Statement[] = [];
    for (;;) {
      this.muted = false;
      this.skipSeparators();
      if (this.cur().kind === 'end-of-file') break;
      this.append(body, this.parseStatementWithProgress());
    }
    return { type: 'Program', start: 0, end: this.textLength, body };
  }

  // ---- instruções ----

  private parseStatementWithProgress(): Ast.Statement {
    const before = this.consumed;
    const statement = this.parseStatement();
    if (this.consumed === before) this.advance();
    return statement;
  }

  private parseStatement(): Ast.Statement {
    return this.nested(() => this.parseStatementBody());
  }

  private parseStatementBody(): Ast.Statement {
    const token = this.cur();
    switch (token.kind === 'keyword' ? token.keyword?.spelling : undefined) {
      case 'uai': case 'trem': return this.parseVariableStatement();
      case 'faz_trem': case 'vai_na_frente_faz_trem': return this.parseFunction();
      case 'vai_na_frente':
        if (isKeyword(this.lexer.peek(1), 'faz_trem')) return this.parseFunction();
        break;
      case 'se_ocê_quiser': return this.parseIf();
      case 'enquanto_tiver': return this.parseWhile();
      case 'vai_indo': return this.parseFor();
      case 'tenta_aí': return this.parseTry();
      case 'arruma_trem': return this.parseClass();
      case 'faz_favor': return this.parseReturn();
      case 'para_com_isso': case 'continua_aí': return this.parseJump();
      case 'vixe': return this.parseThrow();
      case 'se_num_for': case 'se_não': case 'se_der_ruim': case 'por_fim': return this.parseDangling();
      default: break;
    }
    if (this.startsWithBinaryOperator(token)) return this.parseLeadingOperator(token);
    const expression = this.parseExpression(PRECEDENCE_ASSIGNMENT);
    return { type: 'ExpressionStatement', start: expression.start, expression, ...this.endOfSimple() };
  }

  private startsWithBinaryOperator(token: Token): boolean {
    if (token.kind === 'punctuator') return BINARY_ONLY_PUNCTUATORS.has(token.text) || token.text === '+';
    const spelling = token.kind === 'keyword' ? token.keyword?.spelling : undefined;
    return spelling !== undefined && spelling !== 'menos' && BINARY_PRECEDENCE.has(spelling);
  }

  private parseLeadingOperator(token: Token): Ast.ErrorNode {
    this.report(CODE.leadingOperator, token.start, token.end);
    this.synchronize();
    return this.errorNode(token.start, this.previousEnd);
  }

  private parseBlock(): Ast.BlockStatement {
    const next = this.lookahead(0);
    if (!isPunct(next, '{')) return this.parseBracelessBody(next);
    this.skipNewlines();
    const open = this.advance();
    this.contexts.push('statement');
    const body = this.parseBlockBody();
    this.contexts.pop();
    return { type: 'BlockStatement', start: open.start, end: this.previousEnd, body };
  }

  private parseBracelessBody(next: Token): Ast.BlockStatement {
    const token = this.cur();
    if (next.kind === 'end-of-file') {
      this.reportUnexpected(next);
      return { type: 'BlockStatement', start: next.start, end: next.start, body: [] };
    }
    this.report(CODE.missingBraces, token.start, token.end);
    if (token.kind === 'newline') return { type: 'BlockStatement', start: token.start, end: token.start, body: [] };
    const statement = this.parseStatement();
    return { type: 'BlockStatement', start: token.start, end: this.previousEnd, body: [statement] };
  }

  private parseBlockBody(): Ast.Statement[] {
    const body: Ast.Statement[] = [];
    for (;;) {
      this.muted = false;
      this.skipSeparators();
      const token = this.cur();
      if (isPunct(token, '}')) {
        this.advance();
        return body;
      }
      if (token.kind === 'end-of-file') {
        this.reportUnexpected(token);
        return body;
      }
      this.append(body, this.parseStatementWithProgress());
    }
  }

  private parseBindingName(): Ast.Identifier {
    const token = this.curRaw();
    const isWord = token.kind === 'identifier' || token.kind === 'keyword';
    if (!isWord) {
      this.reportUnexpected(token);
      this.synchronize();
      return { type: 'Identifier', start: token.start, end: token.start, name: '', reference: false };
    }
    if (token.kind === 'keyword' && token.keyword?.keywordClass === 'reserved') {
      this.report(CODE.reservedName, token.start, token.end, { word: token.value });
    }
    this.advanceRaw();
    return { type: 'Identifier', start: token.start, end: token.end, name: token.value, reference: false };
  }

  private parseParams(): Ast.Identifier[] {
    if (!this.expectPunct('(')) return [];
    const params = this.withContext('grouping', () => this.parseList(')', () => this.parseBindingName()));
    this.expectPunct(')');
    return params;
  }

  private parseList<T>(close: string, item: () => T): T[] {
    const items: T[] = [];
    for (;;) {
      const token = this.cur();
      if (isPunct(token, close) || token.kind === 'end-of-file') return items;
      this.append(items, item());
      if (!isPunct(this.cur(), ',')) return items;
      this.advance();
    }
  }

  private parseVariableCore(inFor: boolean): Ast.VariableDeclaration {
    const declarationToken = this.advance();
    const id = this.parseBindingName();
    const { init, assignToken } = this.parseInitializer();
    if (init === null && !inFor && isKeyword(declarationToken, 'uai')) this.report(CODE.constWithoutValue, declarationToken.start, id.end);
    return { type: 'VariableDeclaration', start: declarationToken.start, end: this.previousEnd, declarationToken, id, init, needsTerminator: false, ...(assignToken ? { assignToken } : {}) };
  }

  private parseInitializer(): { readonly init: Ast.Expression | null; readonly assignToken?: Token } {
    const token = this.cur();
    if (!isKeyword(token, 'é') && !isPunct(token, '=')) return { init: null };
    this.advance();
    this.reportJsOperator(token);
    this.skipNewlines();
    return { init: this.parseExpression(PRECEDENCE_ASSIGNMENT), assignToken: token };
  }

  private parseVariableStatement(): Ast.VariableDeclaration {
    const declaration = this.parseVariableCore(false);
    return { ...declaration, ...this.endOfSimple() };
  }

  private parseFunction(): Ast.FunctionDeclaration {
    const asyncToken = isKeyword(this.cur(), 'vai_na_frente') ? this.advance() : undefined;
    const keywordToken = this.advance();
    const id = this.parseBindingName();
    const params = this.parseParams();
    const body = this.parseBlock();
    const start = (asyncToken ?? keywordToken).start;
    return { type: 'FunctionDeclaration', start, end: this.previousEnd, keywordToken, id, params, body, ...(asyncToken ? { asyncToken } : {}) };
  }

  private parseParenthesized(): Ast.Expression {
    this.expectPunct('(');
    const test = this.withContext('grouping', () => this.parseExpression(PRECEDENCE_ASSIGNMENT));
    this.expectPunct(')');
    return test;
  }

  private continuesWith(spelling: string): boolean {
    if (!isKeyword(this.lookahead(0), spelling)) return false;
    this.skipNewlines();
    return true;
  }

  private parseIf(): Ast.IfStatement {
    const keywordToken = this.advance();
    const test = this.parseParenthesized();
    const consequent = this.parseBlock();
    const hasElseIf = this.continuesWith('se_num_for');
    const alternateIf = hasElseIf ? this.nested(() => this.parseIf()) : null;
    const elseToken = alternateIf === null && this.continuesWith('se_não') ? this.advance() : undefined;
    const alternate = alternateIf ?? (elseToken ? this.parseBlock() : null);
    return { type: 'IfStatement', start: keywordToken.start, end: this.previousEnd, keywordToken, test, consequent, alternate, ...(elseToken ? { elseToken } : {}) };
  }

  private parseWhile(): Ast.WhileStatement {
    const keywordToken = this.advance();
    const test = this.parseParenthesized();
    const body = this.parseBlock();
    return { type: 'WhileStatement', start: keywordToken.start, end: this.previousEnd, keywordToken, test, body };
  }

  private parseFor(): Ast.ForStatement | Ast.ForEachStatement {
    const keywordToken = this.advance();
    this.expectPunct('(');
    const header = this.withContext('grouping', () => this.parseForHeader());
    this.expectPunct(')');
    const body = this.parseBlock();
    const span = { start: keywordToken.start, end: this.previousEnd, keywordToken, body };
    return 'right' in header ? { type: 'ForEachStatement', ...span, ...header } : { type: 'ForStatement', ...span, ...header };
  }

  private parseForHeader(): ForHeader {
    const token = this.cur();
    if (isDeclaration(token) && FOR_RELATIONS.some((word) => isKeyword(this.lookahead(2), word))) {
      const declarationToken = this.advance();
      const id = this.parseBindingName();
      const relationToken = this.advance();
      return { declarationToken, id, relationToken, right: this.parseExpression(PRECEDENCE_ASSIGNMENT) };
    }
    const init = isPunct(token, ';') ? null : isDeclaration(token) ? this.parseVariableCore(true) : this.parseExpression(PRECEDENCE_ASSIGNMENT);
    this.expectPunct(';');
    const test = isPunct(this.cur(), ';') ? null : this.parseExpression(PRECEDENCE_ASSIGNMENT);
    this.expectPunct(';');
    const update = isPunct(this.cur(), ')') ? null : this.parseExpression(PRECEDENCE_ASSIGNMENT);
    return { init, test, update };
  }

  private parseTry(): Ast.TryStatement {
    const keywordToken = this.advance();
    const block = this.parseBlock();
    const handler = this.continuesWith('se_der_ruim') ? this.parseCatch() : null;
    const finalizerToken = this.continuesWith('por_fim') ? this.advance() : undefined;
    const finalizer = finalizerToken ? this.parseBlock() : null;
    if (handler === null && finalizer === null) this.reportUnexpected(this.cur());
    return {
      type: 'TryStatement', start: keywordToken.start, end: this.previousEnd, keywordToken, block, handler, finalizer,
      ...(finalizerToken ? { finalizerToken } : {}),
    };
  }

  private parseCatch(): Ast.CatchClause {
    const keywordToken = this.advance();
    const hasParam = isPunct(this.cur(), '(');
    if (hasParam) this.advance();
    const param = hasParam ? this.withContext('grouping', () => this.parseBindingName()) : null;
    if (hasParam) this.expectPunct(')');
    this.catchParams.push(param?.name ?? '');
    const body = this.parseBlock();
    this.catchParams.pop();
    return { type: 'CatchClause', start: keywordToken.start, end: this.previousEnd, keywordToken, param, body };
  }

  private parseClass(): Ast.ClassDeclaration {
    const keywordToken = this.advance();
    const id = this.parseBindingName();
    const extendsToken = isKeyword(this.cur(), 'inherda_de') ? this.advance() : undefined;
    const superClass = extendsToken ? this.parsePostfix(true) : null;
    if (isPunct(this.lookahead(0), '{')) this.skipNewlines();
    const members = this.expectPunct('{') ? this.withContext('statement', () => this.parseClassMembers()) : [];
    return {
      type: 'ClassDeclaration', start: keywordToken.start, end: this.previousEnd, keywordToken, id, superClass, members,
      ...(extendsToken ? { extendsToken } : {}),
    };
  }

  private parseClassMembers(): Ast.MethodDefinition[] {
    const members: Ast.MethodDefinition[] = [];
    for (;;) {
      this.muted = false;
      this.skipSeparators();
      const token = this.cur();
      if (isPunct(token, '}')) {
        this.advance();
        return members;
      }
      if (token.kind === 'end-of-file') {
        this.reportUnexpected(token);
        return members;
      }
      const before = this.consumed;
      this.append(members, this.parseMethod());
      if (this.consumed === before) this.advance();
    }
  }

  private modifier(spelling: string): Token | undefined {
    return isKeyword(this.cur(), spelling) && !isPunct(this.lookahead(1), '(') ? this.advance() : undefined;
  }

  private parseMethod(): Ast.MethodDefinition {
    const staticToken = this.modifier('num_muda');
    const asyncToken = this.modifier('vai_na_frente');
    const nameToken = this.curRaw();
    const isConstructor = isKeyword(nameToken, 'aprepara_trem');
    const key: Ast.PropertyName = isConstructor
      ? { type: 'PropertyName', start: nameToken.start, end: this.advanceRaw().end, name: 'constructor', keywordToken: nameToken }
      : this.parsePropertyName();
    const params = this.parseParams();
    const body = this.parseBlock();
    const start = (staticToken ?? asyncToken ?? nameToken).start;
    return {
      type: 'MethodDefinition', start, end: this.previousEnd, key, params, body, isConstructor,
      ...(staticToken ? { staticToken } : {}), ...(asyncToken ? { asyncToken } : {}),
    };
  }

  private parseReturn(): Ast.ReturnStatement {
    const keywordToken = this.advance();
    const argument = endsSimple(this.cur()) ? null : this.parseExpression(PRECEDENCE_ASSIGNMENT);
    return { type: 'ReturnStatement', start: keywordToken.start, keywordToken, argument, ...this.endOfSimple() };
  }

  private parseJump(): Ast.JumpStatement {
    const keywordToken = this.advance();
    return { type: 'JumpStatement', start: keywordToken.start, keywordToken, ...this.endOfSimple() };
  }

  private parseThrow(): Ast.ThrowStatement {
    const keywordToken = this.advance();
    const open = this.cur();
    const args = isPunct(open, '(') ? this.parseArguments() : [];
    if (!isPunct(open, '(')) {
      this.reportUnexpected(open);
      this.synchronize();
    } else if (args.length !== 1) {
      this.report(CODE.throwShape, keywordToken.start, keywordToken.end);
    }
    const argument = args[0] ?? this.errorNode(keywordToken.end, keywordToken.end);
    const isNamedError = argument.type === 'Identifier' && this.catchParams.includes(argument.name);
    const wrapsInError = argument.type !== 'NewExpression' && !isNamedError;
    return { type: 'ThrowStatement', start: keywordToken.start, keywordToken, argument, wrapsInError, ...this.endOfSimple() };
  }

  private parseDangling(): Ast.ErrorNode {
    const token = this.advance();
    this.report(CODE.danglingContinuation, token.start, token.end, { word: token.value });
    this.muted = true;
    if (isKeyword(token, 'se_num_for')) this.parseParenthesized();
    if (isKeyword(token, 'se_der_ruim') && isPunct(this.cur(), '(')) {
      this.advance();
      this.withContext('grouping', () => this.parseBindingName());
      this.expectPunct(')');
    }
    if (isPunct(this.lookahead(0), '{')) this.parseBlock();
    return this.errorNode(token.start, this.previousEnd);
  }

  // ---- expressões ----

  private parseExpression(minPower: number): Ast.Expression {
    return this.nested(() => this.parseBinary(minPower));
  }

  private binaryPower(token: Token): number | undefined {
    if (token.kind === 'punctuator') return BINARY_PRECEDENCE.get(token.text);
    return token.kind === 'keyword' && token.keyword ? BINARY_PRECEDENCE.get(token.keyword.spelling) : undefined;
  }

  private isAssignment(token: Token): boolean {
    return isKeyword(token, 'é') || (token.kind === 'punctuator' && ASSIGNMENT_PUNCTUATORS.has(token.text));
  }

  private parseBinary(minPower: number): Ast.Expression {
    let left = this.parsePrefix();
    for (let chain = 1; ; chain += 1) {
      const token = this.cur();
      const assignment = this.isAssignment(token);
      const power = assignment ? PRECEDENCE_ASSIGNMENT : this.binaryPower(token);
      if (power === undefined || power < minPower) return left;
      if (this.depth + chain > MAX_NESTING_DEPTH) return this.stopAtDepth(left);
      this.advance();
      this.reportJsOperator(token);
      this.skipNewlines();
      left = assignment ? this.finishAssignment(left, token) : this.finishBinary(left, token, power);
    }
  }

  private stopAtDepth<T extends Ast.Expression>(node: T): T {
    this.reportDepth(this.lexer.peek());
    this.synchronize();
    return node;
  }

  private finishBinary(left: Ast.Expression, operatorToken: Token, power: number): Ast.BinaryExpression {
    const right = this.parseExpression(power + 1);
    return { type: 'BinaryExpression', start: left.start, end: this.previousEnd, operatorToken, left, right };
  }

  private finishAssignment(left: Ast.Expression, assignToken: Token): Ast.AssignmentExpression {
    const right = this.parseExpression(PRECEDENCE_ASSIGNMENT);
    const validTarget = left.type === 'Identifier' || left.type === 'MemberExpression' || left.type === 'ErrorNode';
    if (!validTarget) this.report(CODE.badTarget, left.start, left.end);
    return { type: 'AssignmentExpression', start: left.start, end: this.previousEnd, assignToken, left, right };
  }

  private parsePrefix(): Ast.Expression {
    const token = this.cur();
    const word = token.kind === 'keyword' ? token.keyword?.spelling : undefined;
    const isPrefix = (word !== undefined && PREFIX_WORDS.has(word)) || isPunct(token, '-') || isPunct(token, '!');
    if (!isPrefix) return this.parsePostfix(true);
    this.advance();
    this.reportJsOperator(token);
    const argument = this.parseExpression(PRECEDENCE_UNARY);
    return { type: 'UnaryExpression', start: token.start, end: this.previousEnd, operatorToken: token, argument };
  }

  private parsePostfix(allowCalls: boolean): Ast.Expression {
    let expression = this.parsePrimary();
    for (let chain = 1; ; chain += 1) {
      const next = this.postfixStep(expression, allowCalls);
      if (next === undefined) return expression;
      if (this.depth + chain > MAX_NESTING_DEPTH) return this.stopAtDepth(next);
      expression = next;
    }
  }

  private postfixStep(object: Ast.Expression, allowCalls: boolean): Ast.Expression | undefined {
    const token = this.cur();
    if (isPunct(token, '(') && allowCalls) {
      const args = this.parseArguments();
      return { type: 'CallExpression', start: object.start, end: this.previousEnd, callee: object, args };
    }
    if (isPunct(token, '[')) return this.parseIndex(object);
    if (isPunct(token, '.')) return this.parseMemberAccess(object);
    if (token.kind === 'newline' && isPunct(this.lookahead(0), '.')) {
      this.skipNewlines();
      return this.parseMemberAccess(object);
    }
    if (isPunct(token, '++') || isPunct(token, '--')) {
      this.advance();
      this.reportJsOperator(token);
      return object;
    }
    return undefined;
  }

  private parseIndex(object: Ast.Expression): Ast.MemberExpression {
    this.advance();
    const property = this.withContext('grouping', () => this.parseExpression(PRECEDENCE_ASSIGNMENT));
    this.expectPunct(']');
    return { type: 'MemberExpression', start: object.start, end: this.previousEnd, object, property, computed: true };
  }

  private parseMemberAccess(object: Ast.Expression): Ast.MemberExpression {
    this.advance();
    this.skipNewlines();
    const property = this.parsePropertyName();
    return { type: 'MemberExpression', start: object.start, end: this.previousEnd, object, property, computed: false };
  }

  private parsePropertyName(): Ast.PropertyName {
    const token = this.curRaw();
    if (token.kind !== 'identifier' && token.kind !== 'keyword') {
      this.reportUnexpected(token);
      this.synchronize();
      return { type: 'PropertyName', start: token.start, end: token.start, name: '' };
    }
    this.advanceRaw();
    return { type: 'PropertyName', start: token.start, end: token.end, name: token.value };
  }

  private parseArguments(): Ast.Expression[] {
    this.advance();
    const args = this.withContext('grouping', () => this.parseList(')', () => this.parseExpression(PRECEDENCE_ASSIGNMENT)));
    this.expectPunct(')');
    return args;
  }

  private literal(token: Token): Ast.Literal {
    return { type: 'Literal', start: token.start, end: token.end, valueToken: this.take(token) };
  }

  private parsePrimary(): Ast.Expression {
    const token = this.cur();
    switch (token.kind) {
      case 'number': case 'string': return this.literal(token);
      case 'identifier': return this.parseNameOrArrow(token);
      case 'keyword': return this.parseKeywordPrimary(token);
      case 'punctuator': return this.parsePunctuatorPrimary(token);
      case 'template': return this.unsupported(token);
      case 'invalid': this.advance(); return this.errorNode(token.start, token.end);
      default: this.reportUnexpected(token); this.synchronize(); return this.errorNode(token.start, token.start);
    }
  }

  private unsupported(token: Token): Ast.ErrorNode {
    this.report(CODE.unsupported, token.start, token.end);
    this.advance();
    this.synchronize();
    return this.errorNode(token.start, token.end);
  }

  private nameOf(token: Token, reference: boolean): Ast.Identifier {
    this.advance();
    return { type: 'Identifier', start: token.start, end: token.end, name: token.value, reference };
  }

  private parseNameOrArrow(token: Token): Ast.Expression {
    if (isPunct(this.lexer.peek(1), '=>')) return this.parseArrowTail(undefined, token, [this.nameOf(token, false)]);
    const global = JS_GLOBALS.get(token.value);
    if (global !== undefined) this.report(CODE.jsGlobal, token.start, token.end, { name: token.value, suggestion: global });
    return this.nameOf(token, true);
  }

  private parseKeywordPrimary(token: Token): Ast.Expression {
    const spelling = token.keyword?.spelling ?? '';
    if (token.keyword?.keywordClass === 'contextual') return this.parseNameOrArrow(token);
    if (LITERAL_WORDS.has(spelling)) return this.literal(token);
    switch (spelling) {
      case 'ocê': return { type: 'ThisExpression', start: token.start, end: this.advance().end, keywordToken: token };
      case 'a_raiz': return { type: 'SuperExpression', start: token.start, end: this.advance().end, keywordToken: token };
      case 'faz_um': return this.parseNew();
      case 'vai_na_frente': return this.parseAsyncArrow();
      case 'vixe': return this.parseThrowAsExpression(token);
      case 'faz_trem': return this.unsupported(token);
      default:
        this.reportUnexpected(token);
        this.synchronize();
        return this.errorNode(token.start, token.start);
    }
  }

  private parseThrowAsExpression(token: Token): Ast.ErrorNode {
    this.report(CODE.throwShape, token.start, token.end);
    this.advance();
    if (isPunct(this.cur(), '(')) this.parseArguments();
    return this.errorNode(token.start, this.previousEnd);
  }

  private parsePunctuatorPrimary(token: Token): Ast.Expression {
    if (isPunct(token, '[')) return this.parseArray();
    if (isPunct(token, '{')) return this.parseObject();
    if (isPunct(token, '(')) {
      const shape = this.arrowShape();
      if (shape.state !== 'none') return this.parseArrowFromParens(undefined, token, shape);
      this.advance();
      const inner = this.withContext('grouping', () => this.parseExpression(PRECEDENCE_ASSIGNMENT));
      this.expectPunct(')');
      return inner;
    }
    this.reportUnexpected(token);
    this.synchronize();
    return this.errorNode(token.start, token.start);
  }

  // Varre até o `)` par e olha se o `=>` vem depois, com ou sem quebra no meio.
  private arrowShape(): ArrowShape {
    let level = 0;
    let offset = 0;
    for (; ; offset += 1) {
      const token = this.lexer.peek(offset);
      if (token.kind === 'end-of-file') return { state: 'none' };
      if (isPunct(token, '(')) level += 1;
      if (isPunct(token, ')')) level -= 1;
      if (level === 0) break;
    }
    const newline = this.lexer.peek(offset + 1).kind === 'newline' ? this.lexer.peek(offset + 1) : undefined;
    const arrow = this.lookaheadAfter(offset + 1);
    if (!isPunct(arrow, '=>')) return { state: 'none' };
    return newline ? { state: 'broken', newline } : { state: 'arrow' };
  }

  private lookaheadAfter(offset: number): Token {
    let position = offset;
    while (this.lexer.peek(position).kind === 'newline') position += 1;
    return this.lexer.peek(position);
  }

  private parseArrowFromParens(asyncToken: Token | undefined, first: Token, shape: ArrowShape): Ast.Expression {
    const params = this.parseParams();
    if (shape.newline) {
      this.report(CODE.brokenArrow, shape.newline.start, shape.newline.end);
      this.skipNewlines();
    }
    return this.parseArrowTail(asyncToken, first, params);
  }

  private parseAsyncArrow(): Ast.Expression {
    const asyncToken = this.advance();
    const next = this.cur();
    if (next.kind === 'identifier' && isPunct(this.lexer.peek(1), '=>')) return this.parseArrowTail(asyncToken, asyncToken, [this.nameOf(next, false)]);
    const shape = isPunct(next, '(') ? this.arrowShape() : { state: 'none' as const };
    if (shape.state !== 'none') return this.parseArrowFromParens(asyncToken, asyncToken, shape);
    this.reportUnexpected(next);
    this.synchronize();
    return this.errorNode(asyncToken.start, next.start);
  }

  private parseArrowTail(asyncToken: Token | undefined, first: Token, params: readonly Ast.Identifier[]): Ast.ArrowFunction {
    this.expectPunct('=>');
    this.skipNewlines();
    const body = isPunct(this.cur(), '{') ? this.parseBlock() : this.parseExpression(PRECEDENCE_ASSIGNMENT);
    return { type: 'ArrowFunction', start: (asyncToken ?? first).start, end: this.previousEnd, params, body, ...(asyncToken ? { asyncToken } : {}) };
  }

  private parseArray(): Ast.ArrayExpression {
    const open = this.advance();
    const elements = this.withContext('grouping', () => this.parseList(']', () => this.parseExpression(PRECEDENCE_ASSIGNMENT)));
    this.expectPunct(']');
    return { type: 'ArrayExpression', start: open.start, end: this.previousEnd, elements };
  }

  private parseObject(): Ast.ObjectExpression {
    const open = this.advance();
    const properties = this.withContext('grouping', () => this.parseList('}', () => this.parseProperty()));
    this.expectPunct('}');
    return { type: 'ObjectExpression', start: open.start, end: this.previousEnd, properties };
  }

  private parseProperty(): Ast.Property {
    const token = this.curRaw();
    const isLiteralKey = token.kind === 'string' || token.kind === 'number';
    if (isPunct(token, '[')) this.report(CODE.unsupported, token.start, token.end);
    const key = isLiteralKey ? this.literal(token) : this.parsePropertyName();
    const hasColon = isPunct(this.cur(), ':');
    if (hasColon) this.advance();
    else {
      this.report(CODE.unsupported, key.start, key.end);
      this.synchronize();
    }
    const value = hasColon ? this.parseExpression(PRECEDENCE_ASSIGNMENT) : this.errorNode(key.end, key.end);
    return { type: 'Property', start: key.start, end: this.previousEnd, key, value };
  }

  private parseNew(): Ast.NewExpression {
    const keywordToken = this.advance();
    const callee = this.parsePostfix(false);
    const args = isPunct(this.cur(), '(') ? this.parseArguments() : [];
    return { type: 'NewExpression', start: keywordToken.start, end: this.previousEnd, keywordToken, callee, args };
  }
}

export function parse(text: string, lexer: Lexer): Ast.ParseResult {
  const parser = new Parser(lexer, text.length);
  const program = parser.parseProgram();
  const all = [...lexer.diagnostics, ...parser.diagnostics];
  return { program, diagnostics: parser.diagnostics, incomplete: all.length > 0 && all.every((diagnostic) => INCOMPLETE_CODES.has(diagnostic.code)) };
}
