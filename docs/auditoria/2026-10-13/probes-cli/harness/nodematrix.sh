#!/usr/bin/env bash
source <scratchpad>/audit/probes-cli/harness/env.sh
cd $P/work/basic
for nb in $N18 $N20 $N22 $N24; do
  v=$($nb -v)
  o1=$($nb $CLI_JS --version 2>&1); c1=$?
  o2=$($nb $CLI_JS bota_pra_moer ola.gs 2>&1 | sed -n '/Eai/p;/Salve/p' | tr '\n' '|')
  o3=$(printf 'faz_favor 40 mais 2\n.vaza\n' | $nb $REPL_JS 2>&1 | grep -c '💬 42')
  o4=$(cd $P/work/examples && for f in basic/exemplo.gs basic/lista-mapeamento.gs basic/ola-mundo.gs classes/pequi.gs; do $nb $CLI_JS bota_pra_moer $f >/dev/null 2>&1; echo -n "$?"; done)
  o5=$($nb $CLI_JS traduz ola.gs -o /dev/stdout 2>/dev/null | md5sum | cut -c1-8)
  printf '%-9s version=%s(exit %s) | moer: %s | REPL 💬42: %s | exemplos exit: %s | md5 JS gerado: %s\n' "$v" "$o1" "$c1" "$o2" "$o3" "$o4" "$o5"
done
