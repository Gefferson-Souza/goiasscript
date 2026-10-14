#!/usr/bin/env bash
source <scratchpad>/audit/probes-cli/harness/env.sh
cd $P/poc
for a in "traduz --ajuda" "traduz x.gs --foo" "traduz x.gs -o" "ajuda traduz" "fuça"; do
  echo "######## goiasscript $a"; node help-goiano.js $a 2>&1 | head -12; echo "(exit ${PIPESTATUS[0]})"
done
