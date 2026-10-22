import type { BindingKind } from '../api.types.ts';
import type { Binding, DeclarationKind, DeclareOutcome, ScopeKind } from './scope.types.ts';

const BINDING_KINDS: ReadonlySet<DeclarationKind> = new Set<BindingKind>(['uai', 'trem', 'faz_trem', 'arruma_trem']);

export const isBindingKind = (kind: DeclarationKind): kind is BindingKind => BINDING_KINDS.has(kind);

export class Scope {
  private readonly bindings = new Map<string, Binding>();

  readonly kind: ScopeKind;
  readonly parent: Scope | null;

  constructor(kind: ScopeKind, parent: Scope | null) {
    this.kind = kind;
    this.parent = parent;
  }

  // Nome herdado da sessão do REPL é substituído; só repetição dentro da mesma entrada é duplicata.
  bind(binding: Binding): DeclareOutcome {
    const existing = this.bindings.get(binding.name);
    if (existing !== undefined && !existing.fromSession) return 'duplicate';
    this.bindings.set(binding.name, binding);
    return 'ok';
  }

  own(name: string): Binding | undefined {
    return this.bindings.get(name);
  }

  lookup(name: string): Binding | undefined {
    return this.bindings.get(name) ?? this.parent?.lookup(name);
  }

  visibleNames(): readonly string[] {
    return [...new Set([...this.bindings.keys(), ...(this.parent?.visibleNames() ?? [])])];
  }
}
