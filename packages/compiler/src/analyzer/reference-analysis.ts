import type { StdlibEntry } from '@goiasscript/language';
import { lookupStdlibMember, lookupStdlibStatic } from '@goiasscript/language';
import type { CallExpression, Expression, Identifier, MemberExpression, Property } from '../ast/ast.types.ts';
import { AnalysisBase } from './analysis-base.ts';
import type { Resolution } from './analyzer.types.ts';
import { CODES } from './codes.constants.ts';
import { checkDeclaredMember, checkMemberAccess } from './javascript-checks.ts';
import { LIBRARY_GLOBAL_NAMES, resolveLibraryGlobal } from './library-scope.ts';
import { checkCallShape, methodAsValueDiagnostic, reservationDiagnostic, reservedEntries } from './library-checks.ts';
import type { MemberValue } from './library-checks.types.ts';
import { memberName, propertyKeyName } from './member-census.ts';
import { unresolvedNameDiagnostic } from './name-checks.ts';
import type { MemberRole } from './reference-analysis.types.ts';

// Referências a nomes e membros: resolve contra o programa, a sessão e a biblioteca, e aplica as checagens de nome.
export abstract class ReferenceAnalysis extends AnalysisBase {
  private readonly failedMembers = new WeakSet<MemberExpression>();

  protected visitIdentifier(identifier: Identifier, assigned = false): void {
    if (identifier.reservedKeyword !== undefined) return;
    const binding = this.scope.lookup(identifier.name);
    if (binding !== undefined) {
      this.resolve(identifier, { kind: binding.fromSession ? 'session' : 'program' });
      if (assigned && binding.kind === 'uai') this.report(CODES.reassignedConstant, identifier.start, identifier.end, { name: identifier.name });
      return;
    }
    const entry = resolveLibraryGlobal(identifier.name);
    if (entry === undefined) {
      this.resolve(identifier, { kind: 'unresolved' });
      this.add(unresolvedNameDiagnostic(identifier, this.candidateNames()));
      return;
    }
    this.resolve(identifier, { kind: 'library', entry });
    if (entry.requiresAsync === true && !this.control.awaitAllowed) this.report(CODES.inputOutsideAsync, identifier.start, identifier.end);
  }

  private candidateNames(): readonly string[] {
    return [...this.scope.visibleNames(), ...LIBRARY_GLOBAL_NAMES];
  }

  protected visitMember(member: MemberExpression, role: MemberRole, argumentCount = 0): void {
    if (member.object.type === 'Super') {
      this.add(this.control.checkSuperMember(member.object));
      this.resolve(member, { kind: 'unresolved' });
      if (member.computed) this.visit(member.property);
      return;
    }
    this.visit(member.object);
    if (member.computed) this.visit(member.property);
    const name = memberName(member);
    const receiver = member.object.type === 'Identifier' ? this.resolutionOf(member.object) : undefined;
    const brokenReceiver = receiver?.kind === 'unresolved' || (member.object.type === 'MemberExpression' && this.failedMembers.has(member.object));
    if (name === undefined || brokenReceiver) {
      this.resolve(member, { kind: 'unresolved' });
      if (brokenReceiver) this.failedMembers.add(member);
      return;
    }
    const namespace = receiver?.kind === 'library' ? receiver.entry?.name : undefined;
    if (this.checkAccess(member, name, namespace)) this.failedMembers.add(member);
    const resolution = this.resolveMember(name, namespace, role);
    this.resolve(member, resolution);
    if (resolution.kind === 'library' && resolution.entry) this.checkUse(member, resolution.entry, role, argumentCount);
  }

  private checkAccess(member: MemberExpression, name: string, namespace: string | undefined): boolean {
    const { property } = member;
    if (member.computed && lookupStdlibMember(name).length > 0) this.report(CODES.textAccessToLibraryName, property.start, property.end);
    const found = checkMemberAccess({ name, start: property.start, end: property.end, declared: this.declaredMembers, ...(namespace === undefined ? {} : { namespace }) });
    this.add(found);
    return found !== undefined;
  }

  private resolveMember(name: string, namespace: string | undefined, role: MemberRole): Resolution {
    const statics = namespace === undefined ? undefined : lookupStdlibStatic(namespace, name);
    if (statics !== undefined) return { kind: 'library', entry: statics };
    const entries = namespace === undefined ? lookupStdlibMember(name) : [];
    const [first] = entries;
    const declared = this.declaredMembers.has(name);
    const reserved = entries.some((entry) => entry.form === 'property');
    const callable = role === 'callee' && entries.some((entry) => entry.form === 'method');
    if (first !== undefined && (!declared || reserved || callable)) return { kind: 'library', entry: first };
    return { kind: declared ? 'program' : 'unresolved' };
  }

  private checkUse(member: MemberExpression, entry: StdlibEntry, role: MemberRole, argumentCount: number): void {
    if (member.computed) return;
    if (role === 'callee') this.add(checkCallShape(entry, argumentCount, member.start, member.end));
    else if (entry.form === 'method') this.add(methodAsValueDiagnostic(entry, member.property.start, member.property.end));
  }

  protected visitCall(call: CallExpression): void {
    const { callee } = call;
    if (callee.type === 'MemberExpression') this.visitMember(callee, 'callee', call.arguments.length);
    else if (callee.type !== 'Super') this.visit(callee);
    for (const argument of call.arguments) this.visit(argument);
    if (callee.type === 'Super') this.add(this.control.checkSuperCall(callee));
  }

  protected visitDeclaredKey(key: Property['key'], value: MemberValue): void {
    this.checkDeclaredName(propertyKeyName(key), key.start, key.end, value);
  }

  protected checkDeclaredName(name: string, start: number, end: number, value: MemberValue): void {
    this.add(checkDeclaredMember(name, start, end));
    const entries = reservedEntries(name, value);
    if (entries.length > 0) this.items.push(reservationDiagnostic(name, entries, start, end));
  }

  protected visitAssignmentTarget(left: Expression, right: Expression): void {
    if (left.type === 'Identifier') this.visitIdentifier(left, true);
    else if (left.type === 'MemberExpression' && left.object.type !== 'Super') this.visitTargetMember(left, right);
    else this.visit(left);
  }

  private visitTargetMember(left: MemberExpression, right: Expression): void {
    this.visit(left.object);
    if (left.computed) this.visit(left.property);
    const name = memberName(left);
    this.resolve(left, { kind: 'program' });
    if (name !== undefined) this.checkDeclaredName(name, left.property.start, left.property.end, right);
  }
}
