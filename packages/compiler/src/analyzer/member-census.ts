import type { AstNode, MemberExpression, Program, Property } from '../ast/ast.types.ts';
import { walk } from '../ast/walk.ts';

export function propertyKeyName(key: Property['key']): string {
  return key.type === 'Identifier' ? key.name : String(key.value);
}

export function memberName(member: MemberExpression): string | undefined {
  const { property } = member;
  if (!member.computed) return property.type === 'Identifier' ? property.name : undefined;
  return property.type === 'Literal' && typeof property.value === 'string' ? property.value : undefined;
}

class MemberCensus {
  private readonly declared = new Set<string>();

  collect(program: Program): ReadonlySet<string> {
    walk(program, (node) => {
      this.record(node);
    });
    return this.declared;
  }

  private record(node: AstNode): void {
    if (node.type === 'Property') this.declared.add(propertyKeyName(node.key));
    else if (node.type === 'MethodDefinition' && node.kind === 'method') this.declared.add(node.key.name);
    else if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
      const name = memberName(node.left);
      if (name !== undefined) this.declared.add(name);
    }
  }
}

export const collectDeclaredMembers = (program: Program): ReadonlySet<string> => new MemberCensus().collect(program);
