import { lookupStdlibGlobal } from '@goiasscript/language';
import type { SessionBinding } from '../api.types.ts';
import type { AstNode, Identifier, MemberExpression, Program } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import type { AnalyzeOptions, Resolution } from './analyzer.types.ts';
import { CODES } from './codes.constants.ts';
import { ControlState } from './control-checks.ts';
import { diagnostic } from './diagnostic.ts';
import type { DiagnosticArgs } from './diagnostic.types.ts';
import { checkBindingName } from './javascript-checks.ts';
import { Scope, isBindingKind } from './scope.ts';
import type { DeclarationKind, ScopeKind } from './scope.types.ts';
import { seedScope } from './session.ts';

const UNRESOLVED: Resolution = { kind: 'unresolved' };

// Estado compartilhado da análise: escopos, diagnósticos, resoluções e contexto de controle.
export abstract class AnalysisBase {
  protected readonly items: RawDiagnostic[] = [];
  protected readonly control = new ControlState();
  protected readonly topLevel = new Map<string, SessionBinding>();
  protected scope: Scope;
  private readonly resolutions = new WeakMap<Identifier | MemberExpression, Resolution>();

  protected readonly program: Program;
  protected readonly source: SourceText;
  protected readonly options: AnalyzeOptions;
  protected readonly declaredMembers: ReadonlySet<string>;

  constructor(program: Program, source: SourceText, options: AnalyzeOptions, declaredMembers: ReadonlySet<string>) {
    this.program = program;
    this.source = source;
    this.options = options;
    this.declaredMembers = declaredMembers;
    this.scope = new Scope('program', null);
    seedScope(this.scope, options.session);
  }

  abstract visit(node: AstNode): void;

  resolutionOf = (node: Identifier | MemberExpression): Resolution => this.resolutions.get(node) ?? UNRESOLVED;

  protected report(code: string, start: number, end: number, args: DiagnosticArgs = {}): void {
    this.items.push(diagnostic(code, start, end, args));
  }

  protected add(found: RawDiagnostic | undefined): void {
    if (found !== undefined) this.items.push(found);
  }

  protected resolve(node: Identifier | MemberExpression, resolution: Resolution): void {
    this.resolutions.set(node, resolution);
  }

  protected withScope(kind: ScopeKind, run: () => void): void {
    const outer = this.scope;
    this.scope = new Scope(kind, outer);
    run();
    this.scope = outer;
  }

  protected declareName(identifier: Identifier, kind: DeclarationKind): void {
    this.add(checkBindingName(identifier));
    this.resolve(identifier, { kind: 'program' });
    if (lookupStdlibGlobal(identifier.name) !== undefined) this.report(CODES.shadowsLibrary, identifier.start, identifier.end, { name: identifier.name });
    const outcome = this.scope.bind({ name: identifier.name, kind, start: identifier.start, fromSession: false });
    if (outcome === 'duplicate') this.report(CODES.duplicateName, identifier.start, identifier.end, { name: identifier.name });
    if (this.scope.kind === 'program' && isBindingKind(kind)) this.topLevel.set(identifier.name, { name: identifier.name, kind });
  }
}
