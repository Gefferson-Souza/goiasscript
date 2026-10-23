# Changesets

Cada mudança que chega aos usuários leva um arquivo de changeset (`corepack pnpm changeset`).
O tipo segue a política de versionamento do spec (§9.5): palavra reservada nova ou removida,
erro novo e aviso promovido a erro pedem `major`; aviso novo e recurso compatível pedem `minor`.

O job `compat` do GitHub compara o vocabulário e os casos de conformidade com a última tag
estável `v3.x.y` e barra o PR cujo changeset for menor que o exigido.
