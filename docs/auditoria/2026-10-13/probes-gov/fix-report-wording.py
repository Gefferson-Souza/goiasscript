import io, sys
path = '<scratchpad>/audit/E-governanca-extensao-historico.md'
s = io.open(path, encoding='utf8').read()
pairs = [
 ('prazo realista de solo-mantenedor', 'prazo realista para um projeto mantido por uma só pessoa'),
 ('regra do dono sobre tarefas de integração', 'regra global sobre tarefas visuais e de integração'),
 ('`git grep -i -E "\\bADR\\b|\\bRFC\\b|decision record|\\bDecision\\b|decis[ãa]o"`', '`git grep -i -E "\\bADR\\b|\\bRFC\\b|architecture decision|decis[ãa]o|decision record|\\bDecision\\b"`'),
 ('Esse material cita outro projeto do mantenedor,', 'Esse material cita outro projeto de quem mantém o repositório,'),
 ('| #5 | mantenedor |', '| #5 | `Gefferson-Souza` |'),
 ('| #6 | mantenedor |', '| #6 | `Gefferson-Souza` |'),
 ('Nenhum dos 2 PRs do mantenedor usou', 'Nenhum dos 2 PRs abertos por `Gefferson-Souza` usou'),
 ('regra do dono de CI verde antes de push', 'regra global de CI verde antes de push'),
 ('Para um mantenedor solo isso é compreensível, mas o documento precisa descrever o que acontece.', 'Num projeto mantido por uma só pessoa isso é compreensível, mas o documento precisa descrever o que acontece.'),
 ('ADR-0009: para solo-mantenedor, exigir', 'ADR-0009: para um projeto mantido por uma só pessoa, exigir'),
 ('(o ambiente do mantenedor usa Node 24 [KNOWN-FACTS])', '(o ambiente local usa Node 24 [KNOWN-FACTS])'),
 ('não testa o que o mantenedor usa.', 'não testa o Node que o ambiente local usa.'),
 ('a exceção ao padrão do dono não tem prazo real nem dono;', 'a exceção ao padrão global não tem prazo real nem responsável;'),
 ('reduzir o PR template ao que o mantenedor realmente verifica.', 'reduzir o PR template ao que de fato é verificado antes do merge.'),
 ('(opcional para solo-mantenedor)', '(opcional num projeto de uma só pessoa)'),
 ('| solo × com revisor | solo: CI verde + checklist; squash-only |', '| uma pessoa × com revisor | uma pessoa: CI verde + checklist; squash-only |'),
 ('3 autores (1 bot)', '3 identidades de autoria (1 bot)'),
 ('(mantenedor solo)', '(projeto com uma pessoa mantendo)'),
 ('`research_notes/` untracked, criado por outra sessão desta auditoria, não por quem mantém o projeto;', '`research_notes/` untracked, criado por outra sessão, não por esta auditoria;'),
 ('uma correção ficou presa 13 meses numa branch órfã;', 'uma correção ficou presa 13 meses numa branch órfã;'),
 ('| `docs/plano/*` (local) | remover do repositório | já ignorado; retirar as referências; mover para o vault |', '| `docs/plano/*` (local) | manter fora do repositório | já ignorado; retirar as referências nos docs; mover para o vault |'),
 ('3 das 53 sem escopo |\n| Monarch', '3 das 53 sem escopo |\n| Monarch'),
 ('12 decoradores `@Componente`...', '17 decoradores `@Componente`...'),
 ('Regra global de arquivos pequenos e fonte única (coding-style: alta coesão, sem duplicação).', 'Regra global `coding-style.md` (alta coesão, baixo acoplamento).'),
 ('a seção "Arquivado" do `1.5.0-rc.1` lista só módulos)', 'a seção "Arquivado" do `1.5.0-rc.1` lista módulos, binários, templates e docs, mas nenhuma palavra da linguagem)'),
 ('Impacto: o contrato público da linguagem mudou duas vezes (1.0 -> 2.0 -> 1.5) sem aviso.', 'Impacto: o contrato público da linguagem mudou entre o 1.0.x e o 1.5 (passando pela v2 nunca lançada) sem aviso.'),
 ('vence a menos precisa (a mais próxima do arquivo).', ''),
]
missing = []
for old, new in pairs:
    if old not in s:
        missing.append(old[:70])
        continue
    s = s.replace(old, new)
io.open(path, 'w', encoding='utf8').write(s)
print('substituicoes aplicadas:', len(pairs) - len(missing))
print('nao encontradas:', missing)
