#!/usr/bin/env bash
# Harness de sondagem: executa um comando num cwd isolado e registra stdout, stderr,
# exit code, diff de arquivos do cwd e (via strace) escritas/exec/rede fora do esperado.
# uso: run.sh <label> <cwd> <cmd...>
# env: NODE_BIN (opcional; só informativo), STDIN_FILE, TIMEOUT (default 60), STRACE=0 desliga
set -u
P=<scratchpad>/audit/probes-cli
label="$1"; cwd="$2"; shift 2
mkdir -p "$P/logs" "$P/npm-cache"

# npm filho (arma_o_barraco web/framework) nunca pode usar rede nem cache global
export npm_config_offline=true npm_config_cache="$P/npm-cache" npm_config_update_notifier=false \
       npm_config_fund=false npm_config_audit=false npm_config_loglevel=error
export NO_COLOR=1 FORCE_COLOR=0

snap() { (cd "$cwd" && find . -mindepth 1 \( -type f -o -type d -o -type l \) -printf '%y %p %s\n' | sort -k2); }
before="$(snap)"

stdin_src="${STDIN_FILE:-/dev/null}"
start=$(date +%s.%N)
if [ "${STRACE:-1}" = "1" ]; then
  ( cd "$cwd" && timeout -k 2 "${TIMEOUT:-60}" strace -f -qq \
      -e trace=openat,mkdir,mkdirat,unlink,unlinkat,rename,renameat,renameat2,rmdir,execve,connect,symlinkat,linkat,chmod,fchmodat,truncate \
      -o "$P/logs/$label.strace" "$@" <"$stdin_src" >"$P/logs/$label.out" 2>"$P/logs/$label.err" )
else
  ( cd "$cwd" && timeout -k 2 "${TIMEOUT:-60}" "$@" <"$stdin_src" >"$P/logs/$label.out" 2>"$P/logs/$label.err" )
fi
code=$?
end=$(date +%s.%N)
after="$(snap)"

printf '%s\n' "$code" > "$P/logs/$label.code"
{
  echo "label: $label"
  echo "cwd:   $cwd"
  echo "cmd:   $*"
  echo "exit:  $code"
  LC_NUMERIC=C printf 'tempo: %.2fs\n' "$(echo "$end - $start" | bc)"
} > "$P/logs/$label.meta"

diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") > "$P/logs/$label.fsdiff" || true

echo "================================================================================"
cat "$P/logs/$label.meta"
echo "--- stdout ($(wc -c < "$P/logs/$label.out") bytes, $(wc -l < "$P/logs/$label.out") linhas):"
head -n "${MAXLINES:-60}" "$P/logs/$label.out"
[ "$(wc -l < "$P/logs/$label.out")" -gt "${MAXLINES:-60}" ] && echo "[... truncado; completo em logs/$label.out]"
echo "--- stderr ($(wc -c < "$P/logs/$label.err") bytes):"
head -n "${MAXLINES:-60}" "$P/logs/$label.err"
echo "--- arquivos alterados no cwd (diff antes/depois):"
if [ -s "$P/logs/$label.fsdiff" ]; then cat "$P/logs/$label.fsdiff"; else echo "(nenhum)"; fi
if [ "${STRACE:-1}" = "1" ]; then
  echo "--- strace:"
  node "$P/harness/analyze-strace.js" "$P/logs/$label.strace" "$cwd" "$P/logs"
fi
