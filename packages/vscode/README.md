# GoiásScript no VS Code

Extensão da linguagem GoiásScript: o editor conhece os arquivos `.gs`, mostra os erros enquanto ocê digita,
sugere as palavras goianas e bota o programa pra moer.

Guardou `uai nome é "Maria"` e depois escreveu `prosa(nomi)`? O editor sublinha o `nomi` e avisa na hora:
*Esse trem "nomi" não existe por aqui. Cê quis dizer "nome"?*

## Instalação

Procure **GoiásScript** na aba de extensões do VS Code (ou no Open VSX, no VSCodium) ou rode
`code --install-extension goiasscript.goiasscript-vscode`. A partir da 3.0.0 a extensão sai como versão estável,
na mesma versão do CLI `goiasscript`.

Se ela ainda não aparecer no catálogo, instale a partir do código do repositório:

```bash
git clone https://github.com/Gefferson-Souza/goiasscript.git
cd goiasscript
corepack pnpm install
corepack pnpm pack:vscode
code --install-extension packages/vscode/pack/goiasscript-vscode-*.vsix
```

## Comandos

- **GoiásScript: Traduz** — mostra o JavaScript que o programa vira.
- **GoiásScript: Bota pra moer** — executa o programa num terminal. Só funciona em pasta confiável.

## Pasta não confiável

No Modo Restrito do VS Code (o modo de pasta em que ocê ainda não confia) a extensão só traduz e mostra os
erros. Executar o programa fica desligado.

## Configuração

- `goiasscript.tone`: jeito de falar das mensagens (`raiz` ou `neutro`).
- `goiasscript.diagnosticsDelayMs`: espera, em milissegundos, antes de conferir os erros.
- `goiasscript.lessonBaseUrl`: endereço https da cartilha, pra cada erro virar um link.

## Versão do Node

O CLI que vem dentro da extensão precisa do Node 22.12 ou mais novo. Em editor que ainda traz um Node mais velho, o comando avisa em goianês (`GS0904`) em vez de quebrar sem explicação.
