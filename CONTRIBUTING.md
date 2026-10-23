# Contribuindo com o GoiásScript

Que bão que ocê quer ajudar, sô! Este guia é curto de propósito: diz como rodar o projeto, como propor uma palavra
nova e como o trabalho entra na `main`.

## Como rodar

Precisa de Node 22.22.1 ou mais novo (o pacote publicado aceita 22.12, mas as ferramentas de desenvolvimento pedem a
versão maior). O `pnpm` vem pelo Corepack, então use sempre `corepack pnpm`.

```bash
git clone https://github.com/SEU_USUARIO/goiasscript.git
cd goiasscript
corepack pnpm install
corepack pnpm verify
```

O `verify` roda tipos, lint, scanner de regras, arquivos gerados, testes com cobertura, dependency-cruiser, knip e a
conferência dos documentos de agentes. Ele precisa sair com zero antes de qualquer commit.

Etapas isoladas: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm rules-scan`,
`corepack pnpm test`, `corepack pnpm depcruise`, `corepack pnpm knip` e `corepack pnpm agent-docs`.

Para mexer nos aplicativos: `corepack pnpm playground:dev` sobe o playground e `corepack pnpm engoianador:dev` sobe
o Worker do Engoianador (precisa de `GROQ_API_KEY` em `apps/engoianador-api/.dev.vars`).

## Como propor uma palavra ou mudança na linguagem

Mudança de linguagem (palavra reservada, método da biblioteca, regra de diagnóstico) só entra por RFC:

1. Copie `docs/rfc/rfc.md` para `docs/rfc/NNNN-assunto.md` e preencha as sete seções.
2. Abra uma issue com o modelo "RFC" apontando para o arquivo.
3. A conversa e a decisão ficam na própria issue; o status do arquivo acompanha.

## O que fica fora da v3

Balaios, debugger, módulos, sistema de tipos, LSP separado, níveis graduais, interop com JavaScript nativo e IR
própria não fazem parte da v3 e só entram por RFC. A lista e o motivo estão em
[docs/adr/0010-fora-da-v3.md](docs/adr/0010-fora-da-v3.md).

## Expectativa de resposta

O projeto tem um único mantenedor, que cuida dele no tempo livre. Não há SLA, ou seja, sem prazo de resposta: issue e PR são lidos
e respondidos quando dá. Se o assunto for urgente de segurança, use o reporte privado descrito no
[SECURITY.md](SECURITY.md).

## Commits

Conventional Commits em português, minúsculos, com escopo semântico, cabeçalho de até 72 caracteres e sem ponto final:

```
fix(compiler): corrige a posição do erro em laço sem chave
```

Tipos e escopos aceitos estão em `commitlint.config.mjs`; a regra completa está em
[docs/adr/0008-commits.md](docs/adr/0008-commits.md). O hook local e o CI barram o que fugir do padrão.

## Como o PR entra

O merge exige CI verde, o checklist de auto-revisão do modelo de PR e a revisão colada na seção "Revisão". O histórico
é linear: squash, ou rebase no PR de fase com um commit por unidade. Não há merge commit. Detalhes em
[docs/adr/0011-fluxo-de-pr-e-historico.md](docs/adr/0011-fluxo-de-pr-e-historico.md).

## Padrões de código

- Identificadores em inglês; mensagens para o usuário, títulos de teste e comentários em português
  ([docs/adr/0007-idioma.md](docs/adr/0007-idioma.md)).
- Comentário só para o porquê que o código não diz, com no máximo 4 linhas.
- Sem `any`, sem `console`, sem valor mágico; imutabilidade por padrão; funções com menos de 50 linhas.
- Teste que falha primeiro, depois a implementação mínima. Cobertura de pelo menos 80%.

## Dúvidas

Abra uma issue. Antes, dê uma olhada nas que já existem em
[github.com/Gefferson-Souza/goiasscript/issues](https://github.com/Gefferson-Souza/goiasscript/issues).

Valeu por ajudar, sô! Bão demais ter ocê na turma.
