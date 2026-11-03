# Changesets

Cada mudança que chega aos usuários leva um arquivo de changeset (`corepack pnpm changeset`).
O tipo segue a política de versionamento do spec (§9.5): palavra reservada nova ou removida,
erro novo e aviso promovido a erro pedem `major`; aviso novo e recurso compatível pedem `minor`.

O job `compat` do GitHub compara o vocabulário e os casos de conformidade com a última tag
estável `v3.x.y` e barra o PR cujo changeset for menor que o exigido.

## E o CHANGELOG da raiz?

Os changesets geram o CHANGELOG de cada pacote que eles versionam, como o `packages/vscode/CHANGELOG.md`
(o `config.json` usa `@changesets/cli/changelog`). Os pacotes `goiasscript` e `goiasscript-vscode` andam juntos
na versão (`fixed`). O `CHANGELOG.md` da raiz não passa por esse gerador: é um texto do repositório que conta a linguagem inteira,
e o ADR-0006 manda registrar nele (e em `docs/spec/migracao.md`) toda remoção e renomeação.
