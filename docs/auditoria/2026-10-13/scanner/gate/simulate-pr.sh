#!/usr/bin/env bash
# Simula uma PR numa cópia FORA do repo e roda o gate de ratchet contra gate/baseline.json.
# Uso: gate/simulate-pr.sh [regressao|melhoria]   (REPO=<caminho> para outro checkout)
set -uo pipefail
SCANNER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${REPO:-<repo>}"
MODE="${1:-regressao}"
SIM="$SCANNER_DIR/sim-$MODE"
rm -rf "$SIM"; mkdir -p "$SIM/repo"
cd "$REPO"
git ls-files | grep -E '^(packages/core/(src|bin|tests)/.*\.js|apps/playground/.*\.(ts|tsx|mjs)|apps/engoianador-api/(src|test)/.*\.ts|apps/playground-e2e/tests/.*\.ts|vscode-extension/src/.*\.js)$' | grep -v 'next-env.d.ts' | while read -r f; do
  mkdir -p "$SIM/repo/$(dirname "$f")"; cp "$f" "$SIM/repo/$f"
done
ln -s "$REPO/node_modules" "$SIM/repo/node_modules"   # só para resolver o parser; removido no fim
cd "$SIM/repo"
# melhoria comum aos dois modos: remove 2 usos de any
sed -i 's/(window as any)\.monaco/(window as unknown as { monaco?: unknown }).monaco/g' apps/playground-e2e/tests/security.spec.ts
if [ "$MODE" = "regressao" ]; then
  cat >> apps/engoianador-api/src/cors.ts <<'EOF'

export function debugOrigem(valor: any): string {
  console.log('origem recebida', valor); // só pra ver
  return String(valor);
}
EOF
  cat > apps/engoianador-api/src/novo.ts <<'EOF'
export function calcularTotal(valor: number, desconto: number): number {
  try {
    return valor - desconto;
  } catch {}
  return 0;
}
EOF
  printf "\nconsole.log('novo aviso de CLI');\n" >> packages/core/bin/goiasscript.js
fi
cd "$SCANNER_DIR"
node scan-rules.mjs --repo "$SIM/repo" --out "$SIM/out" > /dev/null
node gate/check-baseline.mjs --scan "$SIM/out/scan-result.json" --baseline gate/baseline.json --github
STATUS=$?
echo "exit=$STATUS"
node gate/check-baseline.mjs --scan "$SIM/out/scan-result.json" --baseline gate/baseline.json --strict-slack > /dev/null
echo "exit com --strict-slack=$?"
unlink "$SIM/repo/node_modules"
