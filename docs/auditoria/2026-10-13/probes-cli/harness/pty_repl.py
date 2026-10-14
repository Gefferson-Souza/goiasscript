"""Driver de TTY para o REPL: envia teclas e imprime o transcript cru (com escapes visíveis).
uso: python3 -I pty_repl.py <node> <repl.js> <nome-cenario>
"""
import os
import pty
import select
import signal
import sys
import time

node, repl, scenario = sys.argv[1], sys.argv[2], sys.argv[3]

SCENARIOS = {
    # TAB logo após prefixo de keyword: se o completer funcionasse, listaria candidatos
    "tab": [("faz_f\t", 0.6), ("\t\t", 0.6), ("\x15", 0.2), ("prosa(\"apos tab\")\r", 0.6), (".vaza\r", 0.6)],
    # histórico por seta para cima
    "historico": [("prosa(\"primeiro\")\r", 0.6), ("prosa(\"segundo\")\r", 0.6), ("\x1b[A", 0.4), ("\x1b[A", 0.4), ("\r", 0.6), (".vaza\r", 0.6)],
    "ctrl_c": [("prosa(\"vivo\")\r", 0.6), ("\x03", 0.8)],
    "ctrl_d": [("prosa(\"vivo\")\r", 0.6), ("\x04", 0.8)],
    "limpa": [("prosa(\"antes de limpar\")\r", 0.6), (".limpa_o_terreiro\r", 0.8), (".vaza\r", 0.6)],
    "ctrl_c_multilinha": [("faz_trem k() {\r", 0.6), ("\x03", 0.8)],
}

pid, fd = pty.fork()
if pid == 0:
    os.environ["TERM"] = "xterm"
    os.environ["NO_COLOR"] = "1"
    os.execv(node, [node, repl])

buf = b""


def drain(timeout):
    global buf
    end = time.time() + timeout
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.05)
        if r:
            try:
                data = os.read(fd, 4096)
            except OSError:
                return False
            if not data:
                return False
            buf += data
    return True


alive = drain(1.2)  # banner
banner_len = len(buf)
for keys, wait in SCENARIOS[scenario]:
    if not alive:
        break
    try:
        os.write(fd, keys.encode())
    except OSError:
        break
    alive = drain(wait)

time.sleep(0.3)
status = None
try:
    wpid, st = os.waitpid(pid, os.WNOHANG)
    if wpid:
        status = os.waitstatus_to_exitcode(st)
except ChildProcessError:
    pass
if status is None:
    try:
        os.kill(pid, signal.SIGKILL)
        os.waitpid(pid, 0)
        status = "AINDA VIVO (morto pelo driver)"
    except Exception as exc:  # noqa: BLE001
        status = f"?{exc}"

text = buf[banner_len:].decode("utf-8", "replace")
print(f"## cenario={scenario} exit={status}")
print(repr(text))
