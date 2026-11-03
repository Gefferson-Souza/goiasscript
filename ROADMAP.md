# O que vem por aí

Aqui ficam só as coisas que já estão decididas nos documentos do projeto. Não tem data, porque nenhuma foi marcada:
cada item sai quando o dono do projeto aprovar a publicação.

## O que vem

- **A v3 no npm, como alpha.** Hoje o `npm install goiasscript` traz a v2 antiga, arquivada. A v3 vai sair primeiro
  como alpha, na etiqueta (dist-tag) `next`, e só depois de validada ela vira a versão padrão (`latest`). Quem aprova
  cada publicação é o dono, com confirmação em dois passos. Vem de [operacao.md](docs/operacao.md) e do
  [ADR-0009](docs/adr/0009-publicacao.md).
- **A extensão do VS Code no Marketplace e no Open VSX.** Hoje só dá para instalar a partir do código. A
  publicação nos dois catálogos já tem fluxo pronto, disparado por uma etiqueta `vscode-v*`. Vem de
  [operacao.md](docs/operacao.md) e do [ADR-0009](docs/adr/0009-publicacao.md).
- **Endereço público do playground.** O playground roda na Vercel, mas ainda não tem endereço aberto ao público.
  Vem de [operacao.md](docs/operacao.md).
- **Endereço público da tela do Engoianador.** A tela já existe dentro do playground, e a API já está no ar. Falta
  o endereço público do playground, que é onde a tela mora. Vem de [operacao.md](docs/operacao.md).
- **Revisão da escolha de ferramentas.** O [ADR-0005](docs/adr/0005-toolchain.md) marca a revisão em 2027-01-20.

## O que fica fora da v3

Balaios, debugger, módulos, sistema de tipos, LSP separado, níveis graduais, interop com JavaScript nativo e IR
própria. Cada um só entra por RFC. Veja o [ADR-0010](docs/adr/0010-fora-da-v3.md).

## Quem vem da 1.5

Veja a [migração](docs/spec/migracao.md) e o [CHANGELOG](CHANGELOG.md).
