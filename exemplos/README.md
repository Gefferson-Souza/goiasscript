# Exemplos de programa de verdade

Cinco programinhas inteiros, do jeito que gente de verdade escreve. Cada um mora numa pasta com o código (`main.gs`)
e a saída que ele imprime (`saida.txt`). Quem pergunta alguma coisa tem também o que a pessoa digitou (`entrada.txt`).

| Pasta | O que faz | O que ensina |
| --- | --- | --- |
| `churrasco/` | calcula quanto comprar e quanto custa o churrasco | coisa, lista, função, `vai_indo`, `Conta.arredondar_pra_cima` |
| `feira/` | soma a lista da feira e confere se cabe no bolso | `filtrar`, `mapear`, `amontoar`, `ranca_do_meio`, `pergunta` e `vira_número` |
| `boletim/` | média, situação e a melhor nota da turma | classe com `arruma_trem`, método, `se_num_for` |
| `banco/` | depósito, saque, poupança e transferência | herança com `inherda_de` e `a_raiz`, `vixe` com `tenta_aí`, `espera_um_cadim`, `Promessa.tudim_junto` |
| `analisador/` | conta palavras e vogais e inverte uma frase | texto, coisa como contador, `por_fim` |

Para rodar um deles:

```bash
goiasscript bota_pra_moer exemplos/churrasco/main.gs
```

Os caminhos valem a partir da pasta do projeto clonado: rode os comandos de dentro dela.

Os que perguntam (`feira` e `analisador`) esperam ocê digitar. Para não digitar nada, mande a `entrada.txt` como
resposta com o `<`:

```bash
goiasscript bota_pra_moer exemplos/feira/main.gs < exemplos/feira/entrada.txt
```

A resposta que gerou a `saida.txt` está na `entrada.txt`.

Toda vez que o projeto passa pela conferência, cada exemplo é traduzido, executado e comparado letra por letra com a
`saida.txt`. Se a linguagem mudar e um exemplo quebrar, a conferência para ali mesmo.
