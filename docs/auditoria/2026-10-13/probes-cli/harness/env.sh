export P=<scratchpad>/audit/probes-cli
export REPO=<repo>
export CORE=$REPO/packages/core
export CLI_JS=$CORE/bin/goiasscript.js
export REPL_JS=$CORE/bin/goias.js
export OLD_CLI_JS=$CORE/src/cli/index.js
export N18=$HOME/.local/share/fnm/node-versions/v18.20.8/installation/bin/node
export N20=$HOME/.local/share/fnm/node-versions/v20.19.6/installation/bin/node
export N22=$HOME/.local/share/fnm/node-versions/v22.21.1/installation/bin/node
export N24=$HOME/.local/share/fnm/node-versions/v24.21.0/installation/bin/node
run() { bash "$P/harness/run.sh" "$@"; }
export PATH=<scratchpad>/audit/probes-cli/shim:$PATH
export CLEAN_CLI=<scratchpad>/audit/probes-cli/pkgclean/packages/core/bin/goiasscript.js
