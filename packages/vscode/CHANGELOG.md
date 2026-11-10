# Mudanças

## 3.0.0

Versão estável junto com o GoiásScript 3: realce, diagnósticos, completar, dica ao passar o mouse, trechos prontos e
os comandos Traduz e Bota pra moer. A extensão anda na mesma versão do CLI `goiasscript` e é a primeira feita pra sair
no Marketplace e no Open VSX.

O que mudou desde a 0.3.0:

- Cara nova: o ícone da extensão e o dos arquivos `.gs` usam o mesmo símbolo do playground, com a palavra em pequi e
  o cursor em lavanda, e a página da loja abre no fundo escuro da identidade.
- Campo de dado que veio de fora se lê com colchete e aspas, tipo `dado["saldo"]`, sem sublinhado nenhum.
- `faz_um Data(2026, 11, 10)` conta o mês de 1 a 12, igualzim ao `.mês()`.
- Nome velho de método da 1.5 (`.tamanho()`, `.ordenar()`, `.reduzir`, `.inverter`, `.pedaco` e companhia) ganha a
  dica do nome novo.
- No GS0603 e no GS0604, o link da lição vem de quem recebe o membro; quando não tem lição certa, o erro sai sem
  link, mesmo com `goiasscript.lessonBaseUrl` configurado.
- O GS0405 e o GS0305 seguem a mesma ideia: `.getMonth()` numa data não manda mais pra lição de lista, e
  `.reduzir` numa lista manda pra lição de lista em vez da de coisa.
- O realce pinta o nome da função, na declaração e na chamada, e o nome guardado com `uai`.
- As mensagens de erro ficaram mais certeiras: cada erro de sintaxe explica a sua situação, o editor parou de
  sugerir palavra que a linguagem não tem e a função que se chama sem parar ganha frase própria.
- `(7.5).com_casas(2).trocar(".", ",")` e outras cadeias que começam num parêntese voltaram a rodar no Bota pra moer.

## 0.3.0

Pré-lançamento que só se instalava a partir do código do repositório; não chegou a sair no Marketplace nem no
Open VSX.

O que ela trouxe:

- Arquivos `.gs` reconhecidos como GoiásScript, com cores nas palavras e sugestões de trecho (snippets).
- Erros sublinhados enquanto ocê digita, com a dica de como arrumar e, quando tem, o link da lição da cartilha.
- Comando **GoiásScript: Traduz**, que mostra o JavaScript que o programa vira.
- Comando **GoiásScript: Bota pra moer**, que executa o programa num terminal (atalho `Ctrl+Alt+G`, ou `Cmd+Alt+G`
  no Mac). Em pasta não confiável ele fica desligado: a extensão só traduz e mostra os erros.
- Três ajustes: `goiasscript.tone` (mensagens em goianês `raiz` ou `neutro`), `goiasscript.diagnosticsDelayMs`
  (quanto o editor espera antes de conferir) e `goiasscript.lessonBaseUrl` (endereço da cartilha).
