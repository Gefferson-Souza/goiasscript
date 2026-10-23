# GoiásScript no VS Code

Extensão da linguagem GoiásScript: o editor conhece os arquivos `.gs`, mostra os erros enquanto ocê digita,
sugere as palavras goianas e bota o programa pra moer.

## Instalação

- No VS Code: abra a aba de extensões, procure por **GoiásScript** e clique em instalar.
- No VSCodium e em editores parecidos: a extensão também está no Open VSX.
- Pelo terminal: `code --install-extension goiasscript.goiasscript-vscode`.

Enquanto a linguagem não chega na versão 3.0.0, a extensão sai como pré-lançamento (versões `0.3.N`). Na página
da extensão, escolha "Mudar para a versão de pré-lançamento" se o editor não oferecer sozinho.

## Comandos

- **GoiásScript: Traduz** — mostra o JavaScript que o programa vira.
- **GoiásScript: Bota pra moer** — executa o programa num terminal. Só funciona em pasta confiável.

## Pasta não confiável

No Modo Restrito do VS Code a extensão só traduz e mostra os erros. Executar o programa fica desligado.

## Configuração

- `goiasscript.tone`: jeito de falar das mensagens (`raiz` ou `neutro`).
- `goiasscript.diagnosticsDelayMs`: espera, em milissegundos, antes de conferir os erros.
- `goiasscript.lessonBaseUrl`: endereço https da cartilha, pra cada erro virar um link.

## Versão do Node

O CLI que vem dentro da extensão precisa do Node 22.12 ou mais novo. Em editor que ainda traz um Node mais velho, o comando avisa em goianês (`GS0904`) em vez de quebrar sem explicação.
