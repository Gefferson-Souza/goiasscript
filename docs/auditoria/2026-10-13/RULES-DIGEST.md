# Digest das regras estritas do dono (Gefferson) — base da auditoria

Fontes: `<home>/.claude/CLAUDE.md` (global), `<home>/.claude/rules/common/*.md` (global), `CLAUDE.md` da raiz do repo
(local; atenção: está no `.gitignore`), `<workspace>/.claude/rules/*.md` (nível "personal-projects").
Precedência declarada pelo dono: hooks > CLAUDE.md global > rules/common globais > rules TS > CLAUDE.md do projeto.

## 1. Idioma
- Identificadores de código (variáveis, funções, parâmetros, tipos, constantes, propriedades, classes),
  INCLUSIVE em testes (fixtures, helpers, mocks): SEMPRE em inglês. Regra estrita, enforçada por hook.
- Português vive em: comentários, títulos de teste (`describe`/`it`), strings user-facing.
- Regra de ouro do PROJETO GoiásScript: tudo que interage com o usuário é goianês raiz — comandos do CLI,
  mensagens de erro, respostas do sistema, keywords, nomes de balaios/ferramentas, comandos do REPL e do
  debugger, documentação de usuário. "Nunca misturar inglês nas mensagens para usuário", "balaio" em vez de
  "package", nunca os nomes antigos (`gspack`, `gsdebug`, `gsrepl`).
- Ponto a avaliar (não é violação automática): a SUPERFÍCIE da linguagem (keywords e métodos goianos do
  runtime expostos ao código `.gs`, ex. `mapear`, `tamanho`) é goianês por definição; o que deve ser inglês
  é o código INTERNO do compilador/ferramentas.
- Conflito conhecido entre camadas: CLAUDE.md do projeto manda "comentários de código interno em inglês";
  a regra global `comments.md` manda comentários em português. Registrar e propor resolução.

## 2. Comentários (padrão R1–R4, global)
- R1: comentar SÓ o porquê não-óbvio (restrição externa, decisão de negócio não derivável, armadilha real).
- R2 proibido: narrar o que a linha faz; histórico de desenvolvimento no código ("corrige o bug X", "FIXER-1",
  "v2 corrigido aqui"); meta-processo ("confirmado por grep", "achado MEDIUM"); blocos > 4 linhas;
  comentário que descreve outro trecho; comentário dirigido ao revisor.
- R3: acima do bloco (nunca ao lado), máx. 4 linhas; JSDoc só em função exportada cuja assinatura não basta;
  `TODO(TICKET):` exige ticket (TODO sem ticket proibido).
- R4: "se eu deletar este comentário, o próximo dev erra algo?" Se não → não escreva.

## 3. Qualidade de código (global, vale para código novo/tocado; a auditoria mede o legado contra ela)
- Sem `any` (`: any`, `as any`); usar `unknown` + narrowing, generics ou tipo concreto.
- Zero magic values: strings/números nominais → enum/union/constante; config estática → `as const`.
- Imutabilidade: `readonly`/`const` por padrão; sem reatribuir parâmetros; sem mutar objetos (criar cópia).
- Types/constants/DTOs em arquivos próprios (`*.types.ts`, `*.constants.ts`).
- Arquivos pequenos e focados: 200–400 linhas típico, 800 máximo. Funções < 50 linhas. Nesting ≤ 4.
- Erro explícito na fronteira; nunca engolir erro; narrowing seguro de `unknown` em `catch`.
- Sem `console.log` em produção (usar logger); sem `@ts-ignore`/`eslint-disable` sem justificativa `-- motivo`.
- Validar entrada nas fronteiras (schema); nunca confiar em dado externo; sem valores hardcoded.
- Alta coesão, baixo acoplamento; organizar por feature/domínio.

## 4. Testes
- TDD obrigatório (RED → GREEN → REFACTOR). Cobertura mínima 80%. Unit + integração + E2E.
- Testar comportamento, não implementação; testes independentes; casos de borda e erro.

## 5. Segurança
- Sem segredos hardcoded; validar todo input; sem injeção; XSS/CSP; rate limiting; erros sem vazar dados.

## 6. Git / processo
- Conventional Commits `<type>(<scope>): descrição` (pt-BR, imperativo, minúsculo); sem mensagens vagas.
- Fluxo: pesquisa/reuso (GitHub, docs, registries) → plano → TDD → code review → CI verde antes de push.

## 7. Formato de saída obrigatório para auditores
Escreva em português (pt-BR). Estrutura do arquivo de saída:
```
# Auditoria — <área>
## Resumo executivo (5–10 linhas)
## Métricas (tabela)
## Achados (ordenados por severidade: CRITICAL > HIGH > MEDIUM > LOW)
### [SEVERIDADE] Título curto
- Evidência: `caminho/relativo:linha` (+ trecho mínimo ou saída de comando reproduzível)
- Regra/critério violado:
- Impacto:
- Recomendação:
## Conformidade com as regras (matriz regra × ✅/⚠️/❌, com contagem e exemplos)
## Veredito por módulo/arquivo: manter / refatorar / reescrever / remover — com justificativa
## O que vale reaproveitar numa reescrita
```
Só afirme o que verificou (leitura de código com linha, ou comando executado com saída). Marque
explicitamente o que for hipótese.
