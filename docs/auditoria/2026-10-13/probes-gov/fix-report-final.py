import io
path = '<scratchpad>/audit/E-governanca-extensao-historico.md'
s = io.open(path, encoding='utf8').read()
pairs = [
 ('cria `PWNED_ASPAS`). Resíduos em `probes-gov/inj/`.', 'cria `PWNED_ASPAS`). Roteiro de reprodução e marcador em `probes-gov/inj/` (`POC.txt`, `PWNED_ASPAS`); os arquivos com nomes-payload foram removidos depois da prova.'),
 ('| `inj/` | PoC do F01 (arquivos `PWNED_*` criados na prova) |', '| `inj/` | PoC do F01: `POC.txt` (roteiro) e o marcador `PWNED_ASPAS` criado pela injeção |'),
 ('`:150-156` projeta "~36 arquivos / ~120 testes" (real: 124 arquivos / 85 testes);', '`:150-156` projeta "~36 arquivos / ~120 testes" (real no core: 38 arquivos em `packages/` e 85 testes; o total do repositório, 124 arquivos, inclui apps e extensão);'),
 ('(REST e duas consultas GraphQL de leitura) e por `cargo build`/`clippy` no protótipo Rust.', '(REST e consultas GraphQL de leitura) e por `cargo build`/`clippy` no protótipo Rust (o build não falhou por rede; não verifiquei se baixou crates).'),
]
for old, new in pairs:
    assert old in s, old[:60]
    s = s.replace(old, new)
io.open(path, 'w', encoding='utf8').write(s)
print('ok')
