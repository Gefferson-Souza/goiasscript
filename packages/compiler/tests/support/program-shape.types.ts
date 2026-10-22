export type Expr =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'name'; readonly name: string }
  | { readonly kind: 'binary'; readonly operator: 'mais' | 'menos' | 'vezes'; readonly left: Expr; readonly right: Expr }
  | { readonly kind: 'call'; readonly callee: string; readonly args: readonly Expr[] };
export type Stmt =
  | { readonly kind: 'declaration'; readonly keyword: 'uai' | 'trem'; readonly name: string; readonly init: Expr }
  | { readonly kind: 'expression'; readonly expr: Expr }
  | { readonly kind: 'if'; readonly test: Expr; readonly body: readonly Stmt[] }
  | { readonly kind: 'function'; readonly name: string; readonly params: readonly string[]; readonly body: readonly Stmt[] };
export type ProgramShape = readonly Stmt[];
