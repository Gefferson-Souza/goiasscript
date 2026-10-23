import type { BindingKind } from '../api.types.ts';
import { CandidatePool } from './candidate-pool.ts';
import type { Binding, DeclarationKind, DeclareOutcome, ScopeKind } from './scope.types.ts';

const BINDING_KINDS: ReadonlySet<DeclarationKind> = new Set<BindingKind>(['uai', 'trem', 'faz_trem', 'arruma_trem']);

export const isBindingKind = (kind: DeclarationKind): kind is BindingKind => BINDING_KINDS.has(kind);

export class Scope {
  private readonly bindings = new Map<string, Binding>();
  private readonly namePool = new CandidatePool();

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
    if (existing === undefined) this.namePool.add(binding.name);
    this.bindings.set(binding.name, binding);
    return 'ok';
  }

  own(name: string): Binding | undefined {
    return this.bindings.get(name);
  }

  lookup(name: string): Binding | undefined {
    return this.bindings.get(name) ?? this.parent?.lookup(name);
  }

  // Pode repetir nomes sombreados; quem consome escolhe o primeiro melhor, então a repetição é inofensiva.
  suggestionPools(): readonly CandidatePool[] {
    return [this.namePool, ...(this.parent?.suggestionPools() ?? [])];
  }
}
