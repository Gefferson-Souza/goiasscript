import io
path = '<scratchpad>/audit/E-governanca-extensao-historico.md'
s = io.open(path, encoding='utf8').read()
before = s
pairs = [
 ('`README.md:164` (linha que começa com `[` colada à anterior, armadilha de ASI:', '`README.md:170` (a linha começa com `[` e se cola ao `trocar(...)` da linha 167, armadilha de ASI:'),
 ('`docs/METODOS_GOIANOS.md:297-309` (`se (...)` não existe)', '`docs/METODOS_GOIANOS.md:309` (`se (...)` não existe)'),
 ('corrigir `README.md:164` com `;`', 'corrigir `README.md:167-170` com `;`'),
 ('(`README.md:164`, F09)', '(`README.md:167-170`, F09)'),
]
for old, new in pairs:
    assert old in s, old[:60]
    s = s.replace(old, new)
s = s.replace('197-199', '198-199')
io.open(path, 'w', encoding='utf8').write(s)
print('ok; ocorrencias restantes de 164:', s.count('README.md:164'), '| de 197-199:', s.count('197-199'))
