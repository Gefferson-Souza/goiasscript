# goiasscript

## 3.0.0

### Major Changes

- Solta a versão 3 estável do GoiásScript: compilador com lexer e parser feitos à mão, mensagens em goianês com dica e trecho, CLI `goiasscript`, roda de prosa `goias`, extensão do VS Code e cartilha no playground. O que mudou desde a 2 está em `/cartilha/o-que-mudou`.

### O que mais entrou antes de fechar a 3.0.0

Na linguagem:

- Campo de dado que veio de fora se lê com colchete e aspas, tipo `dado["saldo"]`, sem o compilador reclamar do
  campo. Quando ocê escreve `dado.saldo` e o nome não bate com nada, o GS0305 mostra o jeito do colchete.
- `faz_um Data(2026, 11, 10)` conta o mês de 1 a 12, igualzim ao `.mês()`. `Data()`, `Data("texto")` e `Data(0)`
  continuam do mesmo jeito.
- Quem vem da 1.5 e usa nome velho de método ganha a dica do nome novo: `.tamanho()` vira `.o_tanto`, `.ordenar()`
  vira `.arruma()`, `.arranca_o_rabo()` vira `.ranca_o_rabo()`, `.reduzir` vira `.amontoar`, `.inverter` vira
  `.de_trás_pra_frente()`, `.pedaco` vira `.naco`, `.quando_resolver` vira `.quando_der_bão` e `.se_der_pobrema` vira
  `.se_der_ruim`. A dica só vale pra método de valor: `Conta.tamanho` sugere o que existe em `Conta`.
- No GS0603 e no GS0604, a lição da cartilha vem de quem recebe o membro: método de lista aponta a lição de lista,
  `Coisa` aponta a dela, e objeto qualquer fica sem lição em vez de apontar a errada.
- O GS0405 (membro do JavaScript) e o GS0305 (membro que não existe) também olham quem recebe: `.getMonth()` numa
  data sai sem lição, e `.reduzir` numa lista aponta a lição de lista.

Nas mensagens de erro:

- O GS0202 explica cada situação do seu jeito: faltou valor depois do operador, `vixe` sem parênteses, método colado
  em número ou trem grudado no fim de uma seta com chaves (`x => { } mais 1`), que agora é barrado.
- O compilador parou de sugerir palavra que a linguagem não tem (`requisito`, `avaliar`, `janela`, `publico`...).
  Palavra que é só do JavaScript ganha o aviso de que não existe em GoiásScript, e `require`, `process` e `module`
  explicam que a v3 não mexe com o Node.
- Função que se chama sem parar e texto que não é uma `Coisa` válida no `Coisa.vira_coisa` ganham frase e dica
  próprias, sem mudar o código do erro.
- O fim do erro mostra o título da lição (`lição: Guardando trem com uai e trem`) em vez do id cru.

No terminal:

- O `dedo_de_prosa` mostra Goiás em pequi e o `arma_o_barraco` pinta a manchete de sucesso. Em pipe, em arquivo, com
  `NO_COLOR` ou com `TERM=dumb`, sai sem cor nenhuma.
- `--help`, `-h`, `ajuda` e `--ajuda` mostram a ajuda, e o GS0905 fala do uso como um todo, sem dizer que o comando
  não existe quando o problema é outro.
- O `arma_o_barraco` diz qual pasta já existe e o que fazer.
- A roda de prosa mostra o que o programa disse no `vixe`, igual o `bota_pra_moer`.

Consertos:

- `(7.5).com_casas(2).trocar(".", ",")` e outras cadeias que começam num parêntese voltaram a rodar.
- Trecho opcional com muito `[[` sem fechar não trava mais a formatação das mensagens.
- As ferramentas de desenvolvimento foram atualizadas (incluindo as correções de segurança do glob, do minimatch e do
  azure identity). O balaio `goiasscript` continua sem dependência nenhuma na hora de rodar.
