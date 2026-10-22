import type { ReplSession } from '../api.types.ts';
import type { Scope } from './scope.ts';

export function seedScope(scope: Scope, session: ReplSession | undefined): void {
  for (const binding of session?.bindings ?? []) scope.bind({ name: binding.name, kind: binding.kind, start: 0, fromSession: true });
}

export const sessionMembers = (session: ReplSession | undefined): readonly string[] => session?.members ?? [];
