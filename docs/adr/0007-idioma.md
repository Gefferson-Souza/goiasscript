# ADR-0007: Idioma

- Status: proposto; as exceções dependem da aprovação do dono (spec §10.3)

## Contexto

A linguagem é para quem aprende em português, e o código do projeto precisa continuar legível para quem contribui de fora.

## Decisão

- Identificadores e nomes de arquivo internos em inglês.
- Comentários e documentação em português.
- Superfície, mensagens, comandos e valores de opção em goianês.
- Discriminantes que o usuário não digita (`CompileTarget`, `receiver`, `kind`, `severity`) em inglês.
- `+ - * / %` e `< > <= >=` valem ao lado das palavras; `=`, `==`, `===`, `!=`, `&&`, `||` e `!` dão erro.
- Chave de TODO: `GS-<n>`.

## Consequências

Vocabulário goiano só como valor string de dado.

## Confirmação

Scanner R14 (`tools/rules-scan`), estendido aos segmentos de caminho, e `@typescript-eslint/naming-convention`.
