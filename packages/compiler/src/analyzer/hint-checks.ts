import type { ArrowFunctionExpression, AstNode, ThrowStatement, CallExpression, Expression, ForStatement, IfStatement, Program, Statement, WhileStatement } from '../ast/ast.types.ts';
import { forEachChild } from '../ast/walk.ts';
import type { CompileTarget } from '../api.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import { ADD_OPERATOR, ASSIGN_SPELLING, DECIMAL_COMMA_NUMBERS, FALLBACK_CONSTRUCT, FOR_CONSTRUCT, FUNCTION_TYPES, NO_EFFECT_TYPES, isConsoleOutput } from './hint-checks.constants.ts';
import type { HintResult, ResolveNode } from './hint-checks.types.ts';
import { hasLoopExit } from './loop-exit.ts';
import { memberName } from './member-census.ts';

// Avisos pedagógicos e fatos da árvore que o rebaixamento consome (relançamento, await e eco do REPL).
class HintVisitor {
  private readonly found: RawDiagnostic[] = [];
  private readonly rethrows = new Set<ThrowStatement>();
  private catchParams: readonly string[] = [];
  private functionDepth = 0;
  private topLevelAwait = false;

  private readonly source: SourceText;
  private readonly target: CompileTarget;
  private readonly resolve: ResolveNode;

  constructor(source: SourceText, target: CompileTarget, resolve: ResolveNode) {
    this.source = source;
    this.target = target;
    this.resolve = resolve;
  }

  run(program: Program): HintResult {
    this.visit(program);
    const last = program.body.at(-1);
    const lastTopLevelExpression = last?.type === 'ExpressionStatement' ? last : undefined;
    return {
      diagnostics: this.found,
      rethrowStatements: this.rethrows,
      hasTopLevelAwait: this.topLevelAwait,
      ...(lastTopLevelExpression ? { lastTopLevelExpression } : {}),
    };
  }

  private visit(node: AstNode): void {
    this.inspect(node);
    const isFunction = FUNCTION_TYPES.has(node.type);
    const catchParam = node.type === 'CatchClause' && node.param ? node.param.name : undefined;
    if (isFunction) this.functionDepth += 1;
    if (catchParam !== undefined) this.catchParams = [...this.catchParams, catchParam];
    forEachChild(node, (child) => {
      this.visit(child);
    });
    if (catchParam !== undefined) this.catchParams = this.catchParams.slice(0, -1);
    if (isFunction) this.functionDepth -= 1;
  }

  private inspect(node: AstNode): void {
    switch (node.type) {
      case 'Program':
        this.checkBody(node.body, this.target === 'repl');
        break;
      case 'BlockStatement':
        this.checkBody(node.body, false);
        break;
      case 'IfStatement':
      case 'WhileStatement':
        this.checkCondition(node);
        break;
      case 'ForStatement':
        this.checkFor(node);
        break;
      case 'CallExpression':
        this.checkCall(node);
        break;
      case 'NewExpression':
      case 'ArrayExpression':
        this.checkDecimalCommas(node.type === 'ArrayExpression' ? node.elements : node.arguments);
        break;
      case 'ThrowStatement':
        this.checkRethrow(node);
        break;
      case 'AwaitExpression':
        if (this.functionDepth === 0) this.topLevelAwait = true;
        break;
      default:
        break;
    }
  }

  private checkBody(body: readonly Statement[], isReplTop: boolean): void {
    const returnIndex = body.findIndex((statement) => statement.type === 'ReturnStatement');
    const unreachable = body.slice(returnIndex + 1).find((statement) => statement.type !== 'FunctionDeclaration');
    if (returnIndex >= 0 && unreachable) this.found.push(diagnostic(CODES.unreachableCode, unreachable.start, unreachable.end));
    for (const statement of body) {
      if (statement.type === 'ExpressionStatement' && !isReplTop) this.checkNoEffect(statement.expression);
    }
  }

  private checkNoEffect(expression: Expression): void {
    if (!NO_EFFECT_TYPES.has(expression.type)) return;
    const suggestion = this.additionSuggestion(expression);
    this.found.push(diagnostic(CODES.statementWithoutEffect, expression.start, expression.end, suggestion === undefined ? {} : { suggestion }));
  }

  private additionSuggestion(expression: Expression): string | undefined {
    if (expression.type !== 'BinaryExpression' || expression.operator !== ADD_OPERATOR || expression.left.type !== 'Identifier') return undefined;
    const { name } = expression.left;
    const operand = this.source.text.slice(expression.right.start, expression.right.end);
    return `${name} ${ASSIGN_SPELLING} ${name} ${expression.operatorToken.text} ${operand}`;
  }

  private checkCondition(node: IfStatement | WhileStatement): void {
    this.checkAssignmentCondition(node.test, node.keywordToken.text);
    if (node.type === 'WhileStatement' && node.test.type === 'Literal' && node.test.value === true && !hasLoopExit(node.body)) {
      this.found.push(diagnostic(CODES.loopWithoutExit, node.start, node.keywordToken.end));
    }
  }

  private checkFor(node: ForStatement): void {
    if (node.test) this.checkAssignmentCondition(node.test, FOR_CONSTRUCT);
    if (node.update) this.checkNoEffect(node.update);
  }

  private checkAssignmentCondition(test: Expression, construct: string): void {
    if (test.type === 'AssignmentExpression') this.found.push(diagnostic(CODES.assignmentAsCondition, test.start, test.end, { construct }));
  }

  private checkCall(call: CallExpression): void {
    this.checkDecimalCommas(call.arguments);
    const calleeName = call.callee.type === 'MemberExpression' ? memberName(call.callee) : undefined;
    for (const argument of call.arguments) {
      if (argument.type === 'ArrowFunctionExpression') this.checkArrowCondition(argument, calleeName ?? FALLBACK_CONSTRUCT);
    }
    this.checkErrorPassedWhole(call);
  }

  private checkArrowCondition(arrow: ArrowFunctionExpression, construct: string): void {
    const { body } = arrow;
    if (body.type !== 'AssignmentExpression' || body.left.type !== 'Identifier') return;
    const targetName = body.left.name;
    if (arrow.params.some((param) => param.name === targetName)) this.checkAssignmentCondition(body, construct);
  }

  private checkErrorPassedWhole(call: CallExpression): void {
    const caught = this.catchParams.at(-1);
    if (caught === undefined || call.callee.type !== 'Identifier') return;
    const entry = this.resolve(call.callee).entry;
    if (entry === undefined || !isConsoleOutput(entry.js)) return;
    const passed = call.arguments.find((argument) => argument.type === 'Identifier' && argument.name === caught);
    if (passed) this.found.push(diagnostic(CODES.errorPassedWhole, passed.start, passed.end, { name: entry.name }));
  }

  private checkDecimalCommas(items: readonly Expression[]): void {
    items.forEach((item, index) => {
      const next = items[index + 1];
      if (item.type !== 'Literal' || next?.type !== 'Literal' || typeof item.value !== 'number' || typeof next.value !== 'number') return;
      const text = this.source.text.slice(item.start, next.end);
      if (DECIMAL_COMMA_NUMBERS.test(text)) this.found.push(diagnostic(CODES.decimalComma, item.start, next.end, { text }));
    });
  }

  private checkRethrow(node: ThrowStatement): void {
    const caught = this.catchParams.at(-1);
    const [only] = node.arguments;
    if (caught !== undefined && node.arguments.length === 1 && only?.type === 'Identifier' && only.name === caught) this.rethrows.add(node);
  }
}

export const collectHints = (program: Program, source: SourceText, target: CompileTarget, resolve: ResolveNode): HintResult =>
  new HintVisitor(source, target, resolve).run(program);
