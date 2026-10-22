import type {
  ArrowFunctionExpression, AstNode, BlockStatement, CatchClause, ClassDeclaration, ForStatement, ForEachStatement, FunctionDeclaration, Identifier, MethodDefinition, Program, Statement, TryStatement, VariableDeclaration,
} from '../ast/ast.types.ts';
import type { FrameSpec } from './control-checks.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { ReferenceAnalysis } from './reference-analysis.ts';
import type { AnalysisResult, AnalyzeOptions } from './analyzer.types.ts';
import { CODES } from './codes.constants.ts';
import { collectHints } from './hint-checks.ts';
import { collectDeclaredMembers } from './member-census.ts';
import { sessionMembers } from './session.ts';

class Analyzer extends ReferenceAnalysis {
  run(): AnalysisResult {
    this.hoist(this.program.body);
    for (const statement of this.program.body) this.visit(statement);
    const hints = collectHints(this.program, this.source, this.options.target, this.resolutionOf);
    return {
      diagnostics: [...this.items, ...hints.diagnostics].sort((a, b) => a.start - b.start),
      resolutionOf: this.resolutionOf,
      declaredMembers: this.declaredMembers,
      topLevelBindings: [...this.topLevel.values()],
      rethrowStatements: hints.rethrowStatements,
      hasTopLevelAwait: hints.hasTopLevelAwait,
      ...(hints.lastTopLevelExpression ? { lastTopLevelExpression: hints.lastTopLevelExpression } : {}),
    };
  }

  visit(node: AstNode): void {
    switch (node.type) {
      case 'Program':
        break;
      case 'BlockStatement':
        this.visitBlock(node);
        break;
      case 'ExpressionStatement':
        this.visit(node.expression);
        break;
      case 'VariableDeclaration':
        this.visitDeclaration(node, false);
        break;
      case 'FunctionDeclaration':
        this.visitFunction(node);
        break;
      case 'ClassDeclaration':
        this.visitClass(node);
        break;
      case 'ArrowFunctionExpression':
        this.visitArrow(node);
        break;
      default:
        this.visitOther(node);
    }
  }

  private visitOther(node: AstNode): void {
    switch (node.type) {
      case 'IfStatement':
        this.visit(node.test);
        this.visit(node.consequent);
        if (node.alternate) this.visit(node.alternate);
        break;
      case 'WhileStatement':
        this.visit(node.test);
        this.inLoop(node.body);
        break;
      case 'ForStatement':
        this.visitFor(node);
        break;
      case 'ForOfStatement':
      case 'ForInStatement':
        this.visitForEach(node);
        break;
      case 'BreakStatement':
      case 'ContinueStatement':
        this.add(this.control.checkJump(node));
        break;
      case 'ReturnStatement':
        this.add(this.control.checkReturn(node));
        if (node.argument) this.visit(node.argument);
        break;
      case 'ThrowStatement':
        for (const argument of node.arguments) this.visit(argument);
        break;
      case 'TryStatement':
        this.visitTry(node);
        break;
      default:
        this.visitExpression(node);
    }
  }

  private visitExpression(node: AstNode): void {
    switch (node.type) {
      case 'Identifier':
        this.visitIdentifier(node);
        break;
      case 'ThisExpression':
        this.control.markThisUsed();
        break;
      case 'Super':
        this.add(this.control.checkBareSuper(node));
        break;
      case 'CallExpression':
        this.visitCall(node);
        break;
      case 'MemberExpression':
        this.visitMember(node, 'value');
        break;
      case 'AssignmentExpression':
        this.visitAssignmentTarget(node.left, node.right);
        this.visit(node.right);
        break;
      case 'AwaitExpression':
        this.add(this.control.checkAwait(node));
        this.visit(node.argument);
        break;
      default:
        this.visitChildren(node);
    }
  }

  private visitChildren(node: AstNode): void {
    switch (node.type) {
      case 'ObjectExpression':
        for (const property of node.properties) {
          this.visitDeclaredKey(property.key, property.value);
          this.visit(property.value);
        }
        break;
      case 'ArrayExpression':
        for (const element of node.elements) this.visit(element);
        break;
      case 'NewExpression':
        this.visit(node.callee);
        for (const argument of node.arguments) this.visit(argument);
        break;
      case 'UnaryExpression':
        this.visit(node.argument);
        break;
      case 'BinaryExpression':
      case 'LogicalExpression':
        this.visit(node.left);
        this.visit(node.right);
        break;
      default:
        break;
    }
  }

  private hoist(body: readonly Statement[]): void {
    for (const statement of body) {
      if (statement.type === 'VariableDeclaration') this.declareVariables(statement);
      else if (statement.type === 'FunctionDeclaration') this.declareName(statement.id, 'faz_trem');
      else if (statement.type === 'ClassDeclaration') this.declareName(statement.id, 'arruma_trem');
    }
  }

  private declareVariables(declaration: VariableDeclaration): void {
    const kind = declaration.kind === 'const' ? 'uai' : 'trem';
    for (const declarator of declaration.declarations) this.declareName(declarator.id, kind);
  }

  private visitDeclaration(declaration: VariableDeclaration, inForEach: boolean): void {
    for (const declarator of declaration.declarations) {
      if (declarator.init) this.visit(declarator.init);
      else if (declaration.kind === 'const' && !inForEach) this.report(CODES.constantWithoutValue, declarator.start, declarator.end);
    }
  }

  private visitBlock(block: BlockStatement): void {
    this.withScope('block', () => {
      this.hoist(block.body);
      for (const statement of block.body) this.visit(statement);
    });
  }

  private inLoop(body: BlockStatement): void {
    this.control.enterLoop();
    this.visit(body);
    this.control.leaveLoop();
  }

  private visitFor(node: ForStatement): void {
    this.withScope('block', () => {
      const { init } = node;
      if (init?.type === 'VariableDeclaration') {
        this.declareVariables(init);
        this.visitDeclaration(init, false);
      } else if (init) this.visit(init);
      if (node.test) this.visit(node.test);
      if (node.update) this.visit(node.update);
      this.inLoop(node.body);
    });
  }

  private visitForEach(node: ForEachStatement): void {
    this.withScope('block', () => {
      this.declareVariables(node.left);
      this.visitDeclaration(node.left, true);
      this.visit(node.right);
      this.inLoop(node.body);
    });
  }

  private visitTry(node: TryStatement): void {
    this.visit(node.block);
    if (node.handler) this.visitCatch(node.handler);
    if (node.finalizer) this.visit(node.finalizer);
  }

  private visitCatch(handler: CatchClause): void {
    this.withScope('block', () => {
      if (handler.param) this.declareName(handler.param, 'catch');
      this.hoist(handler.body.body);
      for (const statement of handler.body.body) this.visit(statement);
    });
  }

  private visitFunction(node: FunctionDeclaration): void {
    this.visitCallable({ kind: 'function', async: node.async }, node.params, node.body);
  }

  private visitArrow(node: ArrowFunctionExpression): void {
    this.visitCallable({ kind: 'arrow', async: node.async }, node.params, node.body);
  }

  private visitCallable(spec: FrameSpec, params: readonly Identifier[], body: AstNode): void {
    this.control.enterFunction({ ...spec, classHasParent: this.control.currentClassHasParent });
    this.withScope('function', () => {
      for (const param of params) this.declareName(param, 'param');
      if (body.type === 'BlockStatement') {
        this.hoist(body.body);
        for (const statement of body.body) this.visit(statement);
      } else this.visit(body);
    });
    this.control.leaveFunction();
  }

  private visitClass(node: ClassDeclaration): void {
    if (node.superClass) this.visit(node.superClass);
    this.control.enterClass(node.superClass !== null);
    for (const method of node.body) this.visitMethod(method);
    this.control.leaveClass();
  }

  private visitMethod(method: MethodDefinition): void {
    const isConstructor = method.kind === 'constructor';
    if (isConstructor) this.add(this.control.registerConstructor(method));
    else this.checkDeclaredName(method.key.name, method.key.start, method.key.end, 'method');
    this.visitCallable({ kind: isConstructor ? 'constructor' : 'method', async: method.async }, method.params, method.body);
  }
}

export function analyze(program: Program, source: SourceText, options: AnalyzeOptions): AnalysisResult {
  const declared = new Set([...collectDeclaredMembers(program), ...sessionMembers(options.session)]);
  return new Analyzer(program, source, options, declared).run();
}
