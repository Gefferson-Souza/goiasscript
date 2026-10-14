#!/usr/bin/env bash
source <scratchpad>/audit/probes-cli/harness/env.sh
cd $P/pkgclean/packages/core/node_modules
echo "tamanho em KB por pacote (cópia dereferenciada do store do pnpm):"
for d in commander chalk ansi-styles supports-color color-convert color-name has-flag fs-extra graceful-fs jsonfile universalify; do
  [ -d "$d" ] && printf '%-16s %6s KB\n' "$d" "$(/usr/bin/du -sk "$d" | cut -f1)"
done
tot=0; for d in chalk ansi-styles supports-color color-convert color-name has-flag fs-extra graceful-fs jsonfile universalify; do
  [ -d "$d" ] && tot=$((tot + $(/usr/bin/du -sk "$d" | cut -f1)))
done
echo "--- necessário (commander): $(/usr/bin/du -sk commander | cut -f1) KB"
echo "--- desnecessário (usado só por src/cli/index.js): ~${tot} KB em 10 pacotes"
echo "--- dependências declaradas:"; node -e "console.log(require('$CORE/package.json').dependencies)"
