#!/usr/bin/env bash
source <scratchpad>/audit/probes-cli/harness/env.sh
X=$P/work/examples; mkdir -p $X/_out; cd $X
printf '%-34s %-14s %-22s %s\n' "arquivo" "traduz(exit)" "vê_se_tá_certo(exit)" "node --check do JS gerado"
for f in $(find . -name '*.gs' | sort); do
  out=_out/$(echo $f | sed 's|^\./||; s|/|_|g').js
  node $CLI_JS traduz $f -o $out >/dev/null 2>&1; t=$?
  node $CLI_JS "vê_se_tá_certo" $f >/dev/null 2>&1; v=$?
  chk=$(node --check $out 2>&1 | grep -m1 -E 'SyntaxError' | cut -c1-60); [ -z "$chk" ] && chk="OK (sintaxe válida)"
  printf '%-34s %-14s %-22s %s\n' "$f" "$t" "$v" "$chk"
done
