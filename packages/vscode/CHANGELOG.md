# Mudanças

## 3.0.0

- Versão estável junto com o GoiásScript 3: realce, diagnósticos, completar, dica ao passar o mouse, trechos prontos e os comandos Traduz e Bota pra moer.

## 0.3.0

Pré-lançamento: a extensão ainda não está no Marketplace nem no Open VSX. Por enquanto ela se instala a partir do
código do repositório (veja o `README.md` da extensão).

O que ocê ganha:

- Arquivos `.gs` reconhecidos como GoiásScript, com cores nas palavras e sugestões de trecho (snippets).
- Erros sublinhados enquanto ocê digita, com a dica de como arrumar e, quando tem, o link da lição da cartilha.
- Comando **GoiásScript: Traduz**, que mostra o JavaScript que o programa vira.
- Comando **GoiásScript: Bota pra moer**, que executa o programa num terminal (atalho `Ctrl+Alt+G`, ou `Cmd+Alt+G`
  no Mac). Em pasta não confiável ele fica desligado: a extensão só traduz e mostra os erros.
- Três ajustes: `goiasscript.tone` (mensagens em goianês `raiz` ou `neutro`), `goiasscript.diagnosticsDelayMs`
  (quanto o editor espera antes de conferir) e `goiasscript.lessonBaseUrl` (endereço da cartilha).
